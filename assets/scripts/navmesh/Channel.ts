import { Vec3, Vec2 } from "cc";
import { Patroll } from "./Patroll";
export class Channel {
    portals: Patroll[] = [];
    path: Vec3[] = [];

    push(p1: Vec3, p2?: Vec3) {
        if (p2 === undefined) {
            p2 = p1;
        }
        this.portals.push({
            left: p1,
            right: p2,
        });
    }

    triarea2(a: Vec3, b: Vec3, c: Vec3) {
        const ax = b.x - a.x;
        const az = b.z - a.z;
        const bx = c.x - a.x;
        const bz = c.z - a.z;
        return bx * az - ax * bz;
    }

    vequal(a: Vec3, b: Vec3) {
        return Vec3.squaredDistance(a, b) < 0.00001;
    }

    stringPull() {
        const portals = this.portals;
        const pts: Vec3[] = [];
        let portalApex = portals[0].left;
        let portalLeft = portals[0].left;
        let portalRight = portals[0].right;
        let apexIndex = 0;
        let leftIndex = 0;
        let rightIndex = 0;
        pts.push(portalApex);

        for (let i = 1; i < portals.length; i++) {
            const left = portals[i].left;
            const right = portals[i].right;

            if (this.triarea2(portalApex, portalRight, right) <= 0.0) {
                if (this.vequal(portalApex, portalRight) || this.triarea2(portalApex, portalLeft, right) > 0.0) {
                    portalRight = right;
                    rightIndex = i;
                } else {
                    pts.push(portalLeft);
                    portalApex = portalLeft;
                    apexIndex = leftIndex;
                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    i = apexIndex;
                    continue;
                }
            }

            if (this.triarea2(portalApex, portalLeft, left) >= 0.0) {
                if (this.vequal(portalApex, portalLeft) || this.triarea2(portalApex, portalRight, left) < 0.0) {
                    portalLeft = left;
                    leftIndex = i;
                } else {
                    pts.push(portalRight);
                    portalApex = portalRight;
                    apexIndex = rightIndex;
                    portalLeft = portalApex;
                    portalRight = portalApex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    i = apexIndex;
                    continue;
                }
            }
        }

        if (pts.length === 0 || !this.vequal(pts[pts.length - 1], portals[portals.length - 1].left)) {
            pts.push(portals[portals.length - 1].left);
        }

        this.path = pts;
        return pts;
    }
}

