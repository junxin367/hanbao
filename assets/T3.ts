import { _decorator, Component, Node, v3, Vec3, tween, Tween } from 'cc';
import Utils from './scripts/utils/Utils';
const { ccclass, property } = _decorator;

@ccclass('T3')
export class T3 extends Component {
    @property(Node)
    a: Node = null;

    @property(Node)
    box: Node = null;

    start() {

        let aw = this.a.worldPosition.clone();
        let ar = this.a.worldRotation.clone()

        this.scheduleOnce(() => {

            this.a.parent = this.box
            let b = this.a.eulerAngles.clone()

            this.a.worldPosition = aw
            this.a.worldRotation = ar

            let startPos = aw;
            let controlPos = v3()
            let des = this.box.worldPosition.clone()
            Vec3.add(controlPos, startPos, des)
            Vec3.multiplyScalar(controlPos, controlPos, 0.5)
            controlPos.add(v3(0, 5, 0))

            this.bezierTo(this.a, 1, startPos, controlPos, des).start()
            tween(this.a).to(1, { eulerAngles: b }).start()


        }, 3)
    }
    public bezierTo(target: any, duration: number, p1: Vec3, cp: Vec3, p2: Vec3, opts?: any): Tween<any> {
        opts = opts || Object.create(null);
        let twoBezier = (t: number, p1: Vec3, cp: Vec3, p2: Vec3) => {
            let x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            let y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            let z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
            return new Vec3(x, y, z);
        };
        opts.onUpdate = (_arg: Vec3, ratio: number) => {
            target.worldPosition = twoBezier(ratio, p1, cp, p2);
        };
        return tween(target).to(duration, {}, opts);
    }
    update(deltaTime: number) {

    }
}


