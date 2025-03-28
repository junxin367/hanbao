import { _decorator, Rect, rect, Vec3, Node, Vec2, v2, Line, v3, CurveRange, Color, instantiate, Prefab } from "cc";
import { Face } from "../../navmesh/Face";
import { Geometry } from "../../navmesh/Geometry";
import { NavMesh } from "../../navmesh/NavMesh";
import RegionalEditor, { REGIONAL_TYPE } from "./RegionalEditor";
import { EDITOR, PREVIEW } from "cc/env";
import { EventManager, EventType } from "../../event/EventManager";
import { MapItemBase } from "../game/mapitems/MapItemBase";
import { Desk } from "../game/mapitems/Desk";
import BaseComponent from "../../component/Component";
import { Global } from "../../common/Global";
import GuideManager from "../guide/GuideManager";

const ClipperLib = window['ClipperLib'];
const poly2tri: any = window['poly2tri'];
const { ccclass, executeInEditMode, property } = _decorator;

@ccclass("MapManager")
@executeInEditMode
export class MapManager extends BaseComponent {

    @property(Prefab)
    drawitem: Prefab = null;
    lastDeskId = -1;
    private _allMapItems: MapItemBase[] = [];

    public get allMapItems(): MapItemBase[] {
        return this._allMapItems;
    }

    public addMapItem(it: MapItemBase) {
        this._allMapItems.push(it);
    }

    public removeMapItem(it: MapItemBase) {
        for (let i = 0; i < this._allMapItems.length; ++i) {
            if (this._allMapItems[i] == it) {
                this._allMapItems.splice(i, 1);
                return;
            }
        }
    }

    public obstacle: RegionalEditor[] = [];

    private BoostAreas: Node[] = [];

    public desks: Desk[] = [];

    public get mapRect(): Rect {
        let vertexs = this.node.getChildByName("行走区域").getComponent(RegionalEditor).worldVertex;
        let minx = Number.MAX_VALUE
        let minz = Number.MAX_VALUE;
        let maxx = Number.MIN_VALUE;
        let maxz = Number.MIN_VALUE;
        for (var i = 0; i < vertexs.length; ++i) {
            minx = Math.min(minx, vertexs[i].x);
            minz = Math.min(minz, vertexs[i].z);
            maxx = Math.max(maxx, vertexs[i].x);
            maxz = Math.max(maxz, vertexs[i].z);
        }

        return rect(minx, minz, maxx - minx, maxz - minz);
    }

    protected onLoad(): void {
        if (EDITOR) EventManager.Inst.on(EventType.EDIT_MAP, this, this.build);
    }

    private onUnlockMapItem(id: number) {
        this.allMapItems.forEach(a => {
            if (a.cfg) a.refreshState(a.cfg.Id == id);
        })
        this.build();






        GuideManager.Instance().hideGuide()
        this.scheduleOnce(() => {
            GuideManager.Instance().onEventTrigger('onCreateFacility' + id)
        }, 1)


    }

    protected onEnable(): void {
        EventManager.Inst.on(EventType.EVT_UNLOCK_MAPITEM, this, this.onUnlockMapItem);
    }

    protected onDisable(): void {
        if (EDITOR) EventManager.Inst.offAllCaller(this);

    }

    public findPath(begin_ws: Vec3, end_ws: Vec3, zone = "DEFAULT") {
        return this.navmesh.findPath(begin_ws, end_ws, zone);
    }

    protected start(): void {
        setTimeout(() => {
            this.build()
        }, 1000);

        this.BoostAreas = this.GetGameObjects("BoostArea_MoneyArea");
    }

    public getEmptyBoostNode(): Node {
        let list = this.BoostAreas.filter(a => a.children.length == 0);
        list.sort((a, b) => {
            return Vec3.distance(a.worldPosition, Global.player.node.worldPosition) -
                Vec3.distance(b.worldPosition, Global.player.node.worldPosition)
        })
        return list[0];
    }


    @property
    _rebuild: boolean = false;

    set rebuild(value: boolean) {
        this._rebuild = value;
        this.build();
    }

    @property
    get rebuild(): boolean {
        return this._rebuild;
    }

    build() {
        let holePolygons = [];
        let list = this.node.getComponentsInChildren(RegionalEditor)

        for (var i = 0; i < list.length; ++i) {
            let element = list[i];
            if (element.node.name == "行走区域") continue;
            if (!element.node.activeInHierarchy) continue;
            this.obstacle.push(element);
            if (element.type == REGIONAL_TYPE.SAT_ONLEY) continue;
            let tmp = [];
            element.worldVertex.forEach((p, index: number) => {
                tmp.push({ X: p.x, Y: p.z })
            })
            tmp = tmp.reverse()
            holePolygons.push(tmp);
        }

        let points: Vec2[] = [];
        let pointRoot = this.node.getChildByName("优化三角形辅助点");
        if (pointRoot) {
            pointRoot.active = false;
            pointRoot.children.forEach((p: Node) => {
                points.push(v2(p.position.x, p.position.z))
            })
        }

        let mapPolygon = [];
        this.node.getChildByName("行走区域").getComponent(RegionalEditor).worldVertex.forEach((p) => {
            mapPolygon.push(new Vec2(p.x, p.z))
        })

        let tris = this.createNavMesh(mapPolygon, holePolygons, points, "DEFAULT");
        this.clearDraw();

        tris.forEach((tri, i) => {
            let ps = tri.getPoints() as any;
            let p1 = v3(ps[0].x, 0, ps[0].y);
            let p2 = v3(ps[1].x, 0, ps[1].y);
            let p3 = v3(ps[2].x, 0, ps[2].y);
            this.drawLine([p1, p2, p3, p1], Color.WHITE)
        })
    }

    private clearDraw() {
        let debug_content = this.node.getChildByName("debug_content");
        debug_content.destroyAllChildren();
    }

    public drawLine(points: Vec3[], color: Color) {
        if (!EDITOR) return;
        let debug_content = this.node.getChildByName("debug_content");
        if (!this.drawitem) return;
        let tmp = instantiate(this.drawitem)
        tmp.parent = debug_content;
        let line = tmp.getComponent(Line);
        line.width.mode = CurveRange.Mode.Constant;
        line.width.constantMin = 0.05
        line.width.constantMax = 0.05
        line.color.color = color;
        line.positions = points;

        return tmp;
    }

    private navmesh: NavMesh = null;

    private createNavMesh(mapPolygon: Vec2[], polygons: { X: number, Y: number }[][], points: Vec2[], zone: string): any[] {
        var solution_paths = null;
        if (polygons.length >= 2) {
            var cpr = new ClipperLib.Clipper();
            cpr.AddPath(polygons[0], ClipperLib.PolyType.ptSubject, true);
            cpr.AddPath(polygons[1], ClipperLib.PolyType.ptClip, true);

            solution_paths = new ClipperLib.Paths();
            cpr.Execute(ClipperLib.ClipType.ctUnion, solution_paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);


            for (var i = 2; i < polygons.length; ++i) {
                var cpr = new ClipperLib.Clipper();
                cpr.AddPaths(solution_paths, ClipperLib.PolyType.ptSubject, true);
                cpr.AddPath(polygons[i], ClipperLib.PolyType.ptClip, true);
                cpr.Execute(ClipperLib.ClipType.ctUnion, solution_paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
            }
        }


        polygons.length = 0;
        if (solution_paths) {
            for (var i = 0; i < solution_paths.length; ++i) {
                let tmp = [];
                for (var j = 0; j < solution_paths[i].length; ++j) {
                    tmp.push(new Vec2(solution_paths[i][j].X, solution_paths[i][j].Y))
                }
                polygons.push(tmp)
            }
        }
        var tmp: any[] = [];
        var ctx = new poly2tri.SweepContext(mapPolygon, { cloneArrays: true });
        ctx.addPoints(points);
        polygons.forEach((p, k) => {
            tmp = [];
            p.map(pp => {
                tmp.push(pp);
            });
            ctx.addHole(tmp);
        })
        var points_: Vec2[] = ctx['points_'];
        var tris = ctx.triangulate().getTriangles();

        var geometry = new Geometry();
        points_.forEach(p2 => {
            geometry.vertices.push(new Vec3(p2.x, 0, p2.y));
        })

        tris.forEach(tri => {
            var ps = tri.getPoints() as any;
            var face = new Face(points_.indexOf(ps[2]), points_.indexOf(ps[1]), points_.indexOf(ps[0]));
            geometry.faces.push(face);
        })

        this.navmesh = new NavMesh();
        let zonedata = this.navmesh.buildNodes(geometry);
        this.navmesh.setZoneData(zone, zonedata);
        return tris
    }
    getEmptySeat() {
        let all = []
        for (const desk of this.desks) {
            if (!desk.unlock || desk.hasLitter) continue
            let info = desk.getEmptySeat()
            if (info) {
                all.push(info)
            }
        }
        if (all.length > 0) {
            if (this.lastDeskId != -1) {
                let index = all.findIndex(e => e.desk.cfg.Id == this.lastDeskId)
                if (index != -1) {
                    return all[index]
                } else {
                    this.lastDeskId = -1
                }
            }
            let idx = Math.floor(Math.random() * all.length)
            this.lastDeskId = all[idx].desk.cfg.Id
            return all[idx]
        }
        return null
    }
    getSeatWithLitter() {
        for (const desk of this.desks) {
            if (desk.unlock && desk.hasLitter)
                return desk
        }
        return null
    }

    getMapItemById(cfgId: number) {
        for (const temp of this.allMapItems) {
            if (temp.cfg && temp.cfg.Id == cfgId)
                return temp;
        }
        return null
    }
    getNodeByName(name: string) {
        return this.GetGameObject(name)
    }

    buildComplete() {
        return this.navmesh != null
    }
    drivePath = null
    getDrivePath() {
        if (this.drivePath == null) {
            let pathStart = this.getNodeByName('DrivePath').getChildByName('PathStart')
            let path1 = this.getNodeByName('DrivePath').getChildByName('Path1')
            let path2 = this.getNodeByName('DrivePath').getChildByName('Path2')
            const segments = this.calculateSegment(pathStart, path1, path2);

            const totalSegments = [pathStart.worldPosition.clone(), ...segments, path2.worldPosition.clone()];
            this.drivePath = totalSegments
        }
        return this.drivePath
    }

    calculateSegment(pA: Node, pB: Node, pC: Node, segmentCount: number = 20): Vec3[] {
        const pointA = pA.worldPosition.clone();
        const pointB = pB.worldPosition.clone();
        const pointC = pC.worldPosition.clone();

        const distanceAB = pointB.clone().subtract(pointA).length();
        const distanceBC = pointC.clone().subtract(pointB).length();
        const totalDistance = distanceAB + distanceBC;

        const segmentStep = totalDistance / (segmentCount + 1);
        const segmentVectorAB = pointB.clone().subtract(pointA).normalize();
        const segmentVectorBC = pointC.clone().subtract(pointB).normalize();

        const segmentPoints: Vec3[] = [];
        let currentDistance = 0;

        for (let i = 1; i <= segmentCount; i++) {
            const targetDistance = segmentStep * i;

            let segmentPoint: Vec3;

            if (targetDistance <= distanceAB) {
                segmentPoint = pointA.clone().add(segmentVectorAB.clone().multiplyScalar(targetDistance));
            } else {
                segmentPoint = pointB.clone().add(segmentVectorBC.clone().multiplyScalar(targetDistance - distanceAB));
            }

            segmentPoints.push(segmentPoint);
            currentDistance = targetDistance;
        }

        return segmentPoints;
    }

    getOpenDeskCount() {
        let count = 0
        for (const desk of this.desks) {
            if (desk.unlock)
                count++
        }
        return count;
    }

}
