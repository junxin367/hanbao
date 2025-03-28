import { _decorator, Component, Node, Vec3, tween, v3, bezier, Quat } from 'cc';
import { ItemType } from '../../../common/GameConst';
import BaseComponent from '../../../component/Component';
import Utils from '../../../utils/Utils';
import { Player } from '../Player';
const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends BaseComponent {
    delegate: any

    public index: number = 0;
    position = new Vec3();
    rotation = new Quat();
    model: Node;


    state: number = 0

    start() {
        this.model = this.node;


    }
    onEnable() {
        this.node.setScale(v3(1,1,1))
    }
    private _type: number = 0;
    public get type(): number {
        return this._type;
    }
    public set type(value: number) {
        this._type = value;
        if (this.type != ItemType.Package && this.delegate && this.delegate instanceof Player) {
            this.node.position = this.position.clone();
            this.node.rotation = this.rotation.clone();
        }
    }

    update(deltaTime: number) {
        if (this.state == 1 && this.type != ItemType.Package && this.delegate && this.delegate instanceof Player) {
            this.index = this.node.parent.children.indexOf(this.node);
            if (this.index > 30) this.model.active = false;
            if (this.model.active == false) return;
            let { pos, rot } = this.delegate.getStackItemPos(this.index);

            var r = this.sineOut(this.index, 1, 0.2, 80);

            Vec3.lerp(this.position, this.node.worldPosition, pos, r);
            Quat.lerp(this.rotation, this.node.worldRotation, rot, r);
            this.node.worldPosition = this.position;
            this.node.worldRotation = this.rotation;
        }

    }
    flyTo(des: Vec3) {
        this.state = 0
        let startPos = this.node.position.clone();
        let controlPos = v3()
        Vec3.add(controlPos, startPos, des)
        Vec3.multiplyScalar(controlPos, controlPos, 0.5)
        controlPos.add(v3(0, 5, 0))
        Utils.bezierTo(this.node, 0.5, startPos, controlPos, des).call(() => {
            this.state = 1
        }).start()

    }

    sineOut(t: number, b: number, c: number, d: number) {
        return c * Math.sin(t / d * Math.PI) + b;
    }
}


