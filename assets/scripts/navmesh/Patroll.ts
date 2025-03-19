import { Vec3 } from "cc";
import { GroupItem } from "./AStar";
import { Geometry } from "./Geometry";

export class Polygon {
    group?: number;
    id: number;
    vertexIds: number[];
    centroid: Vec3;
    normal: Vec3;
    neighbours: Polygon[]
}

export class Patroll {
    left: Vec3;
    right: Vec3;
    static polygonId = 0;

    static computeCentroids(geometry: Geometry) {
        for (let f = 0, fl = geometry.faces.length; f < fl; f++) {
            let face = geometry.faces[f];
            face.centroid = new Vec3(0, 0, 0);
            Vec3.add(face.centroid, geometry.vertices[face.a], face.centroid);
            Vec3.add(face.centroid, geometry.vertices[face.b], face.centroid);
            Vec3.add(face.centroid, geometry.vertices[face.c], face.centroid);
            Vec3.multiplyScalar(face.centroid, face.centroid, 1 / 3);
        }
    }

    static buildNavigationMesh(geometry: Geometry) {
        Patroll.computeCentroids(geometry);
        geometry.mergeVertices();
        let navigationMesh = Patroll.buildPolygonsFromGeometry(geometry);
        return navigationMesh;
    }

    static buildPolygonsFromGeometry(geometry: Geometry) {
        let polygons: Polygon[] = [];
        let vertices = geometry.vertices;
        for (let i = 0, len = geometry.faces.length; i < len; i++) {
            let face = geometry.faces[i];
            polygons.push({
                id: Patroll.polygonId++,
                vertexIds: [face.a, face.b, face.c],
                centroid: face.centroid,
                normal: face.normal,
                neighbours: []
            });
        }
        let navigationMesh = {
            polygons: polygons,
            vertices: vertices,
        };
        for (let i = 0, len = polygons.length; i < len; i++) {
            let polygon = polygons[i];
            Patroll.buildPolygonNeighbours(polygon, navigationMesh);
        }
        return navigationMesh;
    }


    static buildPolygonNeighbours(polygon: Polygon, navigationMesh: {
        polygons: Polygon[];
        vertices: Vec3[];
    }) {
        polygon.neighbours = [];
        for (let i = 0, len = navigationMesh.polygons.length; i < len; i++) {
            if (polygon === navigationMesh.polygons[i])
                continue;
            let matches = Patroll.arrayIntersect(polygon.vertexIds, navigationMesh.polygons[i].vertexIds);
            if (matches.length >= 2) {
                polygon.neighbours.push(navigationMesh.polygons[i]);
            }
        }
    }

    static arrayIntersect(...params: (string | any[])[]) {
        let i, shortest, nShortest, n, len, ret = [], obj = {}, nOthers;
        nOthers = params.length - 1;
        nShortest = params[0].length;
        shortest = 0;
        for (i = 0; i <= nOthers; i++) {
            n = params[i].length;
            if (n < nShortest) {
                shortest = i;
                nShortest = n;
            }
        }
        for (i = 0; i <= nOthers; i++) {
            n = (i === shortest) ? 0 : (i || shortest);
            len = params[n].length;
            for (let j = 0; j < len; j++) {
                let elem = params[n][j];
                if (obj[elem] === i - 1) {
                    if (i === nOthers) {
                        ret.push(elem);
                        obj[elem] = 0;
                    }
                    else {
                        obj[elem] = i;
                    }
                }
                else if (i === 0) {
                    obj[elem] = 0;
                }
            }
        }
        return ret;
    }

    static groupNavMesh(navigationMesh: { polygons: Polygon[], vertices: Vec3[] }) {
        let saveObj: {
            vertices: Vec3[],
            groups: GroupItem[][]
        } = { vertices: null, groups: null };
        for (let i = 0, len = navigationMesh.vertices.length; i < len; i++) {
            let vertice = navigationMesh.vertices[i];
            vertice.x = Patroll.roundNumber(vertice.x, 2);
            vertice.y = Patroll.roundNumber(vertice.y, 2);
            vertice.z = Patroll.roundNumber(vertice.z, 2);
        }
        saveObj.vertices = navigationMesh.vertices;
        let groups = Patroll.buildPolygonGroups(navigationMesh);
        saveObj.groups = [];
        let findPolygonIndex = function (group, p) {
            for (let i = 0; i < group.length; i++) {
                if (p === group[i])
                    return i;
            }
        };
        for (let i = 0, len = groups.length; i < len; i++) {
            const group = groups[i];
            let newGroup: GroupItem[] = [];
            for (let j = 0, len2 = group.length; j < len2; j++) {
                const p = group[j];
                let neighbours = [];
                let portals: number[][] = [];
                for (let z = 0, len3 = p.neighbours.length; z < len3; z++) {
                    const n = p.neighbours[z];
                    neighbours.push(findPolygonIndex(group, n));
                    portals.push(Patroll.getSharedVerticesInOrder(p, n));
                }
                p.centroid.x = Patroll.roundNumber(p.centroid.x, 2);
                p.centroid.y = Patroll.roundNumber(p.centroid.y, 2);
                p.centroid.z = Patroll.roundNumber(p.centroid.z, 2);
                newGroup.push({
                    id: findPolygonIndex(group, p),
                    neighbours: neighbours,
                    vertexIds: p.vertexIds,
                    centroid: p.centroid,
                    portals: portals
                });
            }
            saveObj.groups.push(newGroup);
        }
        return saveObj;
    }

    static getSharedVerticesInOrder(a: Polygon, b: Polygon) {
        let aList = a.vertexIds;
        let bList = b.vertexIds;
        let sharedVertices: number[] = [];
        for (let i = 0, len = aList.length; i < len; i++) {
            const vId = aList[i];
            if (bList.indexOf(vId) > -1) {
                sharedVertices.push(vId);
            }
        }
        if (sharedVertices.length < 2)
            return [];
        if (sharedVertices.indexOf(aList[0]) > -1 && sharedVertices.indexOf(aList[aList.length - 1]) > -1) {
            aList.push(aList.shift());
        }
        if (sharedVertices.indexOf(bList[0]) > -1 && sharedVertices.indexOf(bList[bList.length - 1]) > -1) {
            bList.push(bList.shift());
        }

        sharedVertices = [];
        for (let i = 0, len = aList.length; i < len; i++) {
            const vId = aList[i];
            if (bList.indexOf(vId) > -1) {
                sharedVertices.push(vId);
            }
        }
        return sharedVertices;
    }

    static buildPolygonGroups(navigationMesh: { polygons: Polygon[], vertices: Vec3[] }) {
        let polygons = navigationMesh.polygons;
        let polygonGroups: Array<Array<Polygon>> = [];
        let groupCount = 0;
        function spreadGroupId(polygon: Polygon) {
            for (let i = 0, len = polygon.neighbours.length; i < len; i++) {
                const neighbour = polygon.neighbours[i];
                if (neighbour.group == undefined) {
                    neighbour.group = polygon.group;
                    spreadGroupId(neighbour);
                }
            }
        }

        for (let i = 0, len = polygons.length; i < len; i++) {
            const polygon = polygons[i];
            if (polygon.group == undefined) {
                polygon.group = groupCount++;
                spreadGroupId(polygon);
            }
            if (!polygonGroups[polygon.group])
                polygonGroups[polygon.group] = [];
            polygonGroups[polygon.group].push(polygon);
        }
        return polygonGroups;
    }

    static roundNumber(number: number, decimals: number) {
        let newnumber = new Number(number + '').toFixed(decimals);
        return parseFloat(newnumber);
    }
}