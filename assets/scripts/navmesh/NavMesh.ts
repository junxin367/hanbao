import { Vec3 } from "cc";
import { AStar, GroupItem } from "./AStar";
import { Channel } from "./Channel";
import { Geometry } from "./Geometry";
import { Patroll } from "./Patroll";
export class NavMesh {
    static zoneNodes: { [key: string]: { vertices: Vec3[], groups: GroupItem[][] } } = {};

    buildNodes(geometry: Geometry) {
        let navigationMesh = Patroll.buildNavigationMesh(geometry);
        let zoneNodes = Patroll.groupNavMesh(navigationMesh);
        return zoneNodes;
    }

    setZoneData(zone: string, data: { vertices: Vec3[], groups: GroupItem[][] }) {
        NavMesh.zoneNodes[zone] = data;
    }

    getGroup(zone: string, position: Vec3) {
        if (!NavMesh.zoneNodes[zone])
            return null;
        let closestNodeGroup: number = null;
        let distance = Math.pow(10, 2);
        for (let i = 0, len = NavMesh.zoneNodes[zone].groups.length; i < len; i++) {
            const group = NavMesh.zoneNodes[zone].groups[i];
            for (let j = 0, len2 = group.length; j < len2; j++) {
                const node: GroupItem = group[j];
                let measuredDistance = Vec3.squaredDistance(node.centroid, position);
                if (measuredDistance < distance) {
                    closestNodeGroup = i;
                    distance = measuredDistance;
                }
            }
        }
        return closestNodeGroup;
    }

    findPath(startPosition: Vec3, targetPosition: Vec3, zone: string = "game", group: number = 0) {

        startPosition.y = 0;
        targetPosition.y = 0;

        let allNodes = NavMesh.zoneNodes[zone].groups[group];
        let vertices = NavMesh.zoneNodes[zone].vertices;
        const closestNode = this.getClosestNode(startPosition, zone, group, false);
        const farthestNode = this.getClosestNode(targetPosition, zone, group, false);
        if (!closestNode || !farthestNode) {
            console.log("不可到达")
            return [];
        }
        let paths = AStar.search(allNodes, closestNode, farthestNode, startPosition) as GroupItem[];
        let getPortalFromTo = function (a, b) {
            for (let i = 0; i < a.neighbours.length; i++) {
                if (a.neighbours[i] === b.id) {
                    return a.portals[i];
                }
            }
        };
        let channel = new Channel();
        channel.push(startPosition);
        for (let i = 0; i < paths.length; i++) {
            let polygon = paths[i];
            let nextPolygon = paths[i + 1];
            if (nextPolygon) {
                let portals = getPortalFromTo(polygon, nextPolygon);
                channel.push(vertices[portals[0]], vertices[portals[1]]);
            }
        }
        channel.push(targetPosition);
        channel.stringPull();
        let threeVectors: Vec3[] = [];
        for (let i = 0, len = channel.path.length; i < len; i++) {
            const c = channel.path[i];
            let vec = new Vec3(c.x, c.y, c.z);
            threeVectors.push(vec);
        }
        return threeVectors;
    }

    static isVectorInPolygon(vector: Vec3, polygon: GroupItem, vertices: Vec3[]) {
        let lowestPoint = 100000;
        let highestPoint = -100000;
        let polygonVertices = [];
        for (let i = 0, len = polygon.vertexIds.length; i < len; i++) {
            const vId = polygon.vertexIds[i];
            lowestPoint = Math.min(vertices[vId].y, lowestPoint);
            highestPoint = Math.max(vertices[vId].y, highestPoint);
            polygonVertices.push(vertices[vId]);
        }
        if (vector.y < highestPoint + 0.5 && vector.y > lowestPoint - 0.5 &&
            this.isPointInPoly(polygonVertices, vector)) {
            return true;
        }
        return false;
    }

    static isPointInPoly(poly: Vec3[], pt: Vec3) {
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].z <= pt.z && pt.z < poly[j].z) || (poly[j].z <= pt.z && pt.z < poly[i].z)) && (pt.x < (poly[j].x - poly[i].x) * (pt.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) && (c = !c);
        return c;
    }


    getClosestNode(position: Vec3, zoneID, groupID, checkPolygon = false) {
        const nodes = NavMesh.zoneNodes[zoneID].groups[groupID];
        const vertices = NavMesh.zoneNodes[zoneID].vertices;
        let closestNode = null;
        let closestDistance = Infinity;

        nodes.forEach((node) => {
            const distance = Vec3.squaredDistance(node.centroid, position);
            if (distance < closestDistance
                && (!checkPolygon || NavMesh.isVectorInPolygon(position, node, vertices))) {
                closestNode = node;
                closestDistance = distance;
            }
        });

        return closestNode;
    }


}