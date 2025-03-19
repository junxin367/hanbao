import { _decorator, Component, Node, Camera, v3, Label, Sprite, MeshRenderer, v4 } from 'cc';
import GameConst, { ItemType } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import BaseComponent from '../../component/Component';
import FSM, { FSMAction } from '../../utils/FSM';
import MeshText from '../../utils/MeshText';
import { Customer } from './Customer';
const { ccclass, property } = _decorator;
let v3_0 = v3()

export enum HEAD_TIP_STATE {
    IDLE,
    FOOD,
    NO_SEAT,
    HAPPY,
    ANGRY
}

@ccclass('HeadTip')
export class HeadTip extends BaseComponent {
    private _target: any;
    node_count: Node
    node_food: Node
    node_bg: Node
    node_happy: Node
    node_angry: Node
    node_no: Node
    node_package: Node

    private fsm: FSM


    public get target(): any {
        return this._target;
    }
    public set target(value: any) {
        this._target = value;
        this._target.node.on(GameConst.EventType.UpdateHeadTip, this.onUpdateHeadTip, this)
      //  this._target.node.on(GameConst.EventType.Remove, this.onRemove, this)

    }
    onLoad() {
        this.node.setRotation(Global.camera._camera_init_rot.clone())



        this.initFsm()
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, HEAD_TIP_STATE.IDLE, this.onIdleEnter))
        this.fsm.addState(new FSMAction(this, HEAD_TIP_STATE.FOOD, this.onFoodEnter))
        this.fsm.addState(new FSMAction(this, HEAD_TIP_STATE.NO_SEAT, this.onNoFoodEnter))
        this.fsm.addState(new FSMAction(this, HEAD_TIP_STATE.HAPPY, this.onHappyEnter))
        this.fsm.addState(new FSMAction(this, HEAD_TIP_STATE.ANGRY, this.onAngryEnter))
    }
    onEnable(): void {

    }
    onDisable(): void {
      //  this._target.node.targetOff(this)
    }
    onRemove() {
      //  AssetPool.Instance().put(this);
    }

    start() {
        let mat = this.node_count.getComponent(MeshRenderer).material
        mat.setProperty("mainColor", v4(0, 0, 0, 1))
    }

    update(deltaTime: number) {
        if (this.target) {
            //this.target.node.getWorldPosition(v3_0);
            //  Global.camera.node.getComponentInChildren(Camera).convertToUINode(v3_0, Global.game.uiNode, v3_0);
            this.node.setPosition(this.target.node.getWorldPosition().clone().add(v3(0, 2)));
        }

    }
    onUpdateHeadTip(v: { type: number, count: number }) {
        this.node_count.getComponent(MeshText).text = v.count + ''
        if (v.type == ItemType.Burger)
            this.node_food.active = true
        else if (v.type == ItemType.Package)
            this.node_package.active = true
    }
    hideAll() {
        // this.node_count.active = false
        this.node_count.getComponent(MeshText).text = "";
        this.node_food.active = false
        this.node_bg.active = false
        this.node_happy.active = false
        this.node_angry.active = false
        this.node_no.active = false
        this.node_package.active = false
    }
    onIdleEnter() {
        this.hideAll()
    }
    onFoodEnter() {
        this.hideAll()
        this.node_count.active = true
        // this.node_food.active = true
        this.node_bg.active = true
    }
    onNoFoodEnter() {
        this.hideAll()
        this.node_bg.active = true
        this.node_no.active = true
    }
    onHappyEnter() {
        this.hideAll()
        this.node_happy.active = true
        this.scheduleOnce(() => {
            this.fsm.changeState(HEAD_TIP_STATE.IDLE)
        }, 1.6)
    }
    onAngryEnter() {
        this.hideAll()
        this.node_angry.active = true
        this.scheduleOnce(() => {
            this.fsm.changeState(HEAD_TIP_STATE.IDLE)
        }, 1.6)
    }
    changeState(s: number) {
        this.fsm.changeState(s, true)
    }
}


