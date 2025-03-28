import { _decorator, Component, Node, find, Color, v3, Vec3, warn, Camera, SkeletalAnimation } from 'cc';
import GameConst, { FacilityAreaType, ItemType } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import FSM, { FSMAction } from '../../utils/FSM';
import { HeadTip, HEAD_TIP_STATE } from './HeadTip';
import { MovePath } from './MovePath';
import Utils from '../../utils/Utils';
import { Role } from './Role';
import Model from '../../data/Model';
const { ccclass, property } = _decorator;

export enum DELIVERY_DRIVER_ACTION {
    GOTO_COUNTER,
    WAITTING_FOOD,
    LEAVING,
}


@ccclass('DeliveryDriver')
export class DeliveryDriver extends Role {
    private _type: number = 0;
    private fsm: FSM = null;

    private moveEngine: MovePath = null;

    public get type(): number {
        return this._type;
    }
    public set type(value: number) {
        this._type = value;
    }

    private ani: SkeletalAnimation;
    start(): void {
        this.ani = this.node.getComponent(SkeletalAnimation);
    }

    updateAni() {
        if (this.moveEngine.running)
            this.playAni('Customer walk')
        else
            this.playAni('Customer_Idle')
    }

    orderComplete() {
        Model.game.deliveryDriverInfo = null
        Model.save();
        this.fsm.changeState(DELIVERY_DRIVER_ACTION.LEAVING)
    }


    orderFail() {
        
        Model.game.deliveryDriverInfo = null
        Model.save();
        this.fsm.changeState(DELIVERY_DRIVER_ACTION.LEAVING)
    }


    private curAni: string = ''
    playAni(aniName) {
        if (this.curAni != aniName) {
            this.ani.play(aniName)
            this.curAni = aniName
        }
    }

    addOne(item: any = null) {
        AssetPool.Instance().put(item);

        let info = Model.game.deliveryDriverInfo;
        info.put++;
    }

    onLoad() {
        this.moveEngine = this.node.addComponent(MovePath);
        this.initFsm();
        this.createInfo();
    }

    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, DELIVERY_DRIVER_ACTION.GOTO_COUNTER, this.onGotoCounterEnter, this.onGotoCounterUpdate))
        this.fsm.addState(new FSMAction(this, DELIVERY_DRIVER_ACTION.WAITTING_FOOD, this.onWattingFoodEnter, this.onWattingFoodUpdate))
        this.fsm.addState(new FSMAction(this, DELIVERY_DRIVER_ACTION.LEAVING, this.onLeavingEnter, this.onLeavingUpdate))
    }

    run() {
        this.fsm.enterState(DELIVERY_DRIVER_ACTION.GOTO_COUNTER)
    }

    createInfo() {

    }

    onGotoCounterEnter() {
        let DeliveryCustomerPath = this.GetGameObject("DeliveryCustomerPath", Global.game.sceneNode, true);
        let Destination = DeliveryCustomerPath.getChildByName("Destination").worldPosition.clone();
        let path = Global.game.map.findPath(this.node.worldPosition, Destination);
        let newPath = path.slice(0, path.length)

        if (newPath.length > 0) {
            this.goto(newPath, () => {
                this.fsm.changeState(DELIVERY_DRIVER_ACTION.WAITTING_FOOD)
            })
        } else {
            warn('customer path error')
        }
    }

    onGotoCounterUpdate(dt: number) {

    }

    private createOrder() {
        let info = Model.game.deliveryDriverInfo;
        if (!info) {
            Model.game.deliveryDriverInfo = {
                time: 5 * 60,
                type: 1,
                need: Utils.randomItem([20, 25, 30]),
                put: 0,
            };
            var needFoodInfo = { type: Model.game.deliveryDriverInfo.type, count: Model.game.deliveryDriverInfo.need }
            this.node.emit(GameConst.EventType.UpdateHeadTip, needFoodInfo)


            info = Model.game.deliveryDriverInfo
        }

        return info;
    }

    onWattingFoodEnter() {
    console.log('deliver waitting food');
        Global.camera.addLookAtNode(this.node, null, 0.8)
    }

    onWattingFoodUpdate(dt: number) {

    }

    onLeavingEnter() {


        let DeliveryCustomerPath = this.GetGameObject("DeliveryCustomerPath", Global.game.sceneNode, true);
        let PathExit_1 = DeliveryCustomerPath.getChildByName("PathExit_1").worldPosition.clone();

        let path = [this.node.worldPosition.clone(), PathExit_1];
        if (path.length > 0) {
            this.goto(path, () => {
                this.node.emit(GameConst.EventType.Remove, this)
            })
        } else {
            warn('customer path error')
        }
    }

    onLeavingUpdate(dt: number) {

    }

    goto(path: Vec3[], callback: Function = null) {
        this.moveEngine.speed = 2
        this.moveEngine.goto(path, callback, (v) => {
            warn('path', v)
        })
        this.moveEngine.running = true
    }

    isOrding() {
        return this.fsm.isInState(DELIVERY_DRIVER_ACTION.WAITTING_FOOD)
    }

    protected lateUpdate(dt: number): void {
        if (this.isOrding()) {
            let info = this.createOrder();
            info.time -= dt;
        }

        this.updateAni();
    }


    public triggerTimeCount: number = 0;
    onTriggerStay(role: Role, type: number) {
        if (performance.now() - this.triggerTimeCount > 100) {
            this.triggerTimeCount = performance.now();

            let info = Model.game.deliveryDriverInfo;
            if (info.put >= info.need) return;

            if (role.canTake(ItemType.Burger)) {
                let ret = role.reduceOne()
                if (ret) {
                    this.addOne(ret)
                }
            }
        }
    }


}