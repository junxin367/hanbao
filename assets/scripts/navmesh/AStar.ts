import { Vec3, Vec2 } from "cc";
import { BinaryHeap } from "./BinaryHeap";


export class AstarNode {
    f?: number = 0;
    g?: number = 0;
    h?: number = 0;
    cost?: number = 0;
    visited?: boolean = false;
    closed?: boolean = false;
    parent?: AstarNode;
}

export class GroupItem extends AstarNode {
    id: number;
    neighbours: number[];
    vertexIds: number[];
    centroid: Vec3;
    portals: number[][];
}

export class AStar {
    static init(graph: GroupItem[], startP: Vec3) {
        for (let x = 0; x < graph.length; x++) {
            let node = graph[x];
            node.f = 0;
            node.g = 0;
            node.h = 0;
            node.cost = Vec2.squaredDistance(startP, node.centroid);
            node.visited = false;
            node.closed = false;
            node.parent = null;
        }
    }

    static cleanUp(graph: AstarNode[]) {
        for (let x = 0; x < graph.length; x++) {
            let node = graph[x];
            delete node.f;
            delete node.g;
            delete node.h;
            delete node.cost;
            delete node.visited;
            delete node.closed;
            delete node.parent;
        }
    }

    static heap() {
        return new BinaryHeap<AstarNode>(function (node: AstarNode) {
            return node.f;
        });
    }

    static heuristic(pos1: Vec3, pos2: Vec3) {
        return Vec2.squaredDistance(pos1, pos2);
    }
    static neighbours(graph, node) {
        let ret = [];
        for (let e = 0; e < node.neighbours.length; e++) {
            ret.push(graph[node.neighbours[e]]);
        }
        return ret;
    }

    static search(graph: GroupItem[], start: GroupItem, end: GroupItem, startP: Vec3): AstarNode[] {
        AStar.init(graph, startP);
        let openHeap = AStar.heap();
        openHeap.push(start);
        while (openHeap.size() > 0) {
            let currentNode = openHeap.pop();
            if (currentNode === end) {
                let curr = currentNode;
                let ret = [];
                while (curr.parent) {
                    ret.push(curr);
                    curr = curr.parent;
                }
                this.cleanUp(ret);
                return ret.reverse();
            }
            currentNode.closed = true;
            let neighbours = AStar.neighbours(graph, currentNode);
            for (let i = 0, il = neighbours.length; i < il; i++) {
                let neighbour = neighbours[i];
                if (neighbour.closed) {
                    continue;
                }
                let gScore = currentNode.g + neighbour.cost;
                let beenVisited = neighbour.visited;
                if (!beenVisited || gScore < neighbour.g) {
                    neighbour.visited = true;
                    neighbour.parent = currentNode;
                    neighbour.h = neighbour.h || AStar.heuristic(neighbour.centroid, end.centroid);
                    neighbour.g = gScore;
                    neighbour.f = neighbour.g + neighbour.h;
                    if (!beenVisited) {
                        openHeap.push(neighbour);
                    }
                    else {
                        openHeap.rescoreElement(neighbour);
                    }
                }
            }
        }
        return [];
    }
}