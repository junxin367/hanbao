import { _decorator, Component, Vec2, v2, Node, Graphics, Color, Line, Vec3, v3, ccenum, Enum } from "cc";
import { EDITOR, PREVIEW } from "cc/env";

const { ccclass, property, executeInEditMode, requireComponent, menu } = _decorator;

export enum REGIONAL_TYPE {
    DEFAULT = 0,
    NAVMESH_ONLEY = 1,
    SAT_ONLEY = 2
}

@ccclass('RegionalEditor')
@executeInEditMode
export default class RegionalEditor extends Component {
    protected start(): void {
        this.draw()
    }

    @property({
        displayName: "区域类型",
        type: Enum(REGIONAL_TYPE)
    })
    public type: REGIONAL_TYPE = REGIONAL_TYPE.DEFAULT;

    private draw() {
        let line = this.node.getComponent(Line)
        line.width.constantMin = 0.05;
        line.width.constantMax = 0.05
        let points = []
        this.node.children.forEach((child, i) => {
            child.scale = v3(0.1, 0.1, 0.1)
            points.push(child.worldPosition)
        })
        if (points.length > 1)
            line.positions = points;
    }

    protected update(dt: number): void {
        if (EDITOR)
            this.draw();
        else {
            let line = this.node.getComponent(Line)
            line.positions = [];
            this.node.children.forEach(child => child.active = false)
            this.node.getComponent(Line).enabled = false
        }
    }

    public get worldVertex(): Vec3[] {
        let points: Vec3[] = [];
        this.node.children.forEach((child, i) => {
            points.push(child.worldPosition)
        })
        return points;
    }

    public get worldVertexXZ(): Vec2[] {
        let points: Vec2[] = [];
        this.node.children.forEach((child, i) => {
            points.push(v2(child.worldPosition.x, child.worldPosition.z))
        })
        return points;
    }
}


