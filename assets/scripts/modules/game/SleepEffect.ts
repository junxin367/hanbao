import { _decorator, Component, Node, tween, v3, Tween } from 'cc';
import GameConst from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
const { ccclass, property } = _decorator;

@ccclass('SleepEffect')
export class SleepEffect extends Component {
    start() {
        this.node.setRotation(Global.camera._camera_init_rot.clone())
    }
    play() {
        let all = this.node.children
        let i = 0
        for (const node of all) {
            Tween.stopAllByTarget(node)
            let s=0.2+i*0.1
            node.setScale(v3(s, s, s))
            tween(node)
                .delay(0.1 * i)               
                .to(0.3, { scale: v3(s+0.2, s+0.2, s+0.2) })
                .to(0.3, { scale: v3(s/2, s/2, s/2) })
                .union()
                .repeatForever()
                .start();
            i++
        }


    }
    private _target: Node;
    public get target(): Node {
        return this._target;
    }
    public set target(value: Node) {
        this._target = value;
        value.on(GameConst.EventType.RemoveSleepState, this.removeSleepState, this)
        this.play()
    }
    removeSleepState() {
        AssetPool.Instance().put(this.node)
    }
    onDisable(): void {
        if (this._target)
            this._target.targetOff(this)
    }
    update(dt)
    {
        if(this._target)
        {
            this.node.setWorldPosition(this._target.worldPosition.clone().add(v3(0, 2, 0)))
        }
    }
}


