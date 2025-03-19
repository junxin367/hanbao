import { _decorator, Component, Node, Vec3, v3, Quat, quat, Color } from 'cc';
import { MoveBase } from './MoveBase';
import { Global } from '../../common/Global';
const { ccclass, property } = _decorator;
//按照路径移动
let v3_0 = v3()
let v3_1 = v3()
let qt_0 = quat()
let qt_1 = quat()
@ccclass('MovePath')
export class MovePath extends MoveBase {
    private arrivecallback: Function = null;
    private updateCallback: Function = null;
    private path: Vec3[]
    private targetPos: Vec3 = null;
    private pathIndex: number = 0
    private offsetRotation: number = 0
    private drawnode: Node = null;
    goto(path: Vec3[], callback: Function = null, updateFunc: Function = null, offsetRotation: number = 0) {
        if (!this.isValid) return;

        this.arrivecallback = callback;
        this.updateCallback = updateFunc;
        this.offsetRotation = offsetRotation
        this.path = path
        this.pathIndex = 0

        if (this.drawnode) this.drawnode.destroy();
        this.drawnode = null;

        this.drawnode = Global.game.map.drawLine(path, Color.YELLOW)
    }
    onStep(dt: number) {
        if (this.path[0]) {
            this.targetPos = this.path[0];
            Vec3.subtract(v3_0, this.node.worldPosition, this.targetPos)
            let dis = v3_0.length()
            if (dis < 0.5) {
                this.updateCallback && this.updateCallback(this.pathIndex)

                this.path.shift();
                this.pathIndex++

                if (this.path.length == 0) {
                    this.targetPos = null;
                    this.running = false
                    if (this.arrivecallback) {
                        if (this.drawnode) this.drawnode.destroy();
                        this.drawnode = null;
                        this.arrivecallback();
                    }
                }
                this.targetPos = this.path[0];
            }

            if (!this.targetPos) return;
            let pos = new Vec3();
            Vec3.subtract(pos, this.targetPos, this.node.worldPosition);
            Vec3.normalize(pos, pos);

            //旋转
            const targetRotation = Math.atan2(pos.x, pos.z) * 180 / Math.PI + this.offsetRotation;
            Quat.fromEuler(qt_0, 0, targetRotation, 0)
            Quat.slerp(qt_1, this.node.rotation, qt_0, 0.2);
            this.node.setRotation(qt_1)

            let speedmul = 1;//((lv - 1) * 0.05 + 1);

            Vec3.multiplyScalar(pos, pos, this.speed * speedmul * dt);
            Vec3.add(pos, this.node.worldPosition, pos);




            this.node.worldPosition = pos;
        }
    }
}