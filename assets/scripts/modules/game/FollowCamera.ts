import { _decorator, Component, Node, Vec3, v3, quat, Quat, Camera } from 'cc';

const { ccclass, property } = _decorator;
let qt_0 = quat()
let qt_1 = quat()
//聚焦信息
interface LookAtInfo {
    node: Node;
    cameraLerpNode?: Node;
    lookTime: number;
    callback: Function
}
@ccclass('FollowCamera')
export class FollowCamera extends Component {
    private _camera_init_pos: Vec3 = null;
     _camera_init_rot: Quat = null;

    private _camera: Camera = null;
    protected start(): void {
        this._camera = this.node.getComponentInChildren(Camera);

        this._camera_init_pos = this._camera.node.position.clone();
        this._camera_init_rot = this._camera.node.rotation.clone();
    }


    private _target: Node = null;
    public get target(): Node {
        return this._target;
    }
    public set target(value: Node) {
        this._target = value;
        // if (value)            
        //     Vec3.subtract(this.offset,this.node.worldPosition,value.worldPosition);
    }


    offset: Vec3 = new Vec3(0, 0, 0);

    @property
    followSpeed: number = 5;

    aidTime: number = 0
    lateUpdate(dt: number) {
        if (!this.target || !this.target.isValid) {
            return;
        }

        let target = this.target;
        if (this.queue.length > 0) {
            this.curLookInfo = this.queue[0]
            target = this.curLookInfo.node
        }

        // 计算目标位置
        const targetPos = v3()
        Vec3.add(targetPos, target.worldPosition, this.offset)

        // 平滑地过渡到目标位置
        const cameraPos = this.node.worldPosition;
        let smoothedPos: Vec3 = v3()
        Vec3.lerp(smoothedPos, cameraPos, targetPos, 0.1);
        // 更新摄像机位置
        this.node.setWorldPosition(smoothedPos);

        let v = v3();
        if (this.curLookInfo && Vec3.subtract(v, this.node.worldPosition, targetPos).length() < 0.1) {
            this.aidTime += dt
            if (this.aidTime > this.curLookInfo.lookTime) {
                this.queue.shift()
                this.curLookInfo.callback && this.curLookInfo.callback()
                this.curLookInfo = null
                this.aidTime = 0



            }

        }

        //角度        
        if (this.curLookInfo && this.curLookInfo.cameraLerpNode) {
            //相机插值到目标位置
            this._camera.node.position = Vec3.lerp(v, this._camera.node.position, this.curLookInfo.cameraLerpNode.position, 0.1)
            this._camera.node.rotation = Quat.slerp(qt_1, this._camera.node.rotation, this.curLookInfo.cameraLerpNode.rotation, 0.1);
        } else {

            this._camera.node.position = Vec3.lerp(v, this._camera.node.position, this._camera_init_pos, 0.1)
            this._camera.node.rotation = Quat.slerp(qt_1, this._camera.node.rotation, this._camera_init_rot, 0.1);
        }
    }


    queue: LookAtInfo[] = []
    curLookInfo: LookAtInfo = null;
    addLookAtNode(node: Node, cameraLerpNode: Node = null, lookTime: number = 0.5, callback: Function = null) {
        this.queue.push({ node: node, cameraLerpNode, lookTime: lookTime, callback: callback })
    }
}
