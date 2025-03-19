import { _decorator, Component, Node, v3, Vec3, CCObject } from 'cc';
import BaseComponent from '../../component/Component';
import { Role } from '../game/Role';
const { ccclass, property } = _decorator;
let v3_0=v3();
@ccclass('DirArrow')
export class DirArrow extends BaseComponent {
    node_arrow:Node=null;
    start() {
        this.node_arrow.active=false;
    }

    update(deltaTime: number) {

    }
    private _target: Role;
    public get target(): Role {
        return this._target;
    }
    public set target(value: Role) {
        this._target = value;
    }
    lateUpdate(deltaTime: number) {
        if (!this._target) return;
        this.node.setPosition(this.target.node.getWorldPosition().clone().add(v3(0, 3, 0)));
        if(this._aimPos!=null)
        {
            this.node.lookAt(this._aimPos);
            Vec3.subtract(v3_0,this.node.worldPosition,this._aimPos)
            this.node_arrow.active=v3_0.length()>6
        }
    }

    private _aimPos: Vec3 = null;
    public get aimPos(): Vec3 {
        return this._aimPos;
    }
    public set aimPos(value: Vec3) {
        this._aimPos = value;
    }
}


