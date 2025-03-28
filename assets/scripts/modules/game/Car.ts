import { _decorator, Component, Node, find, Color, v3, Vec3, warn, Camera } from 'cc';
import GameConst, { ItemType } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import BaseComponent from '../../component/Component';
import { AudioMgr } from '../../utils/AudioMgr';
import FSM, { FSMAction } from '../../utils/FSM';
import { HeadTip, HEAD_TIP_STATE } from './HeadTip';
import { MovePath } from './MovePath';
const { ccclass, property } = _decorator;
export enum CAR_ACTION {
    GOTO_COUNTER,
    WAITTING_IN_QUEUE,
    WAITTING_FOOD,
    LEAVING,
}
@ccclass('Car')
export class Car extends BaseComponent {
    private queueIndex: number = 0;
    private _type: number = GameConst.CAR_TYPE.Normal;
    private fsm: FSM
    private headTip: HeadTip
    private moveEngine: MovePath
    private needFoodInfo: { type: number, count: number }
    private pathIndex: number = 0;
    private lastPathIndex: number = 0;

    public get type(): number {
        return this._type;
    }
    public set type(value: number) {
        this._type = value;
        for (let i = 1; i <= 8; i++) {
            this.GetGameObject('Car_' + i).active = false;
        }
        let rnd = 1
        if (value == GameConst.CAR_TYPE.Normal)
            rnd = Math.floor(Math.random() * 3 + 1)
        else if (value == GameConst.CAR_TYPE.Supercar)
            rnd = 4
        this.GetGameObject('Car_' + rnd).active = true;
    }
    onLoad() {
        this.moveEngine = this.node.addComponent(MovePath)
        this.initFsm()
        this.createInfo()
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, CAR_ACTION.GOTO_COUNTER, this.onGotoCounterEnter, this.onGotoCounterUpdate))
        this.fsm.addState(new FSMAction(this, CAR_ACTION.WAITTING_IN_QUEUE, this.onWaittingInQueueEnter, this.onWaittingInQueueUpdate))
        this.fsm.addState(new FSMAction(this, CAR_ACTION.WAITTING_FOOD, this.onWattingFoodEnter, this.onWattingFoodUpdate))
        this.fsm.addState(new FSMAction(this, CAR_ACTION.LEAVING, this.onLeavingEnter, this.onLeavingUpdate))
    }


    run(index: number) {
        this.queueIndex = index
        this.pathIndex = this.lastPathIndex = 0
        this.fsm.enterState(CAR_ACTION.GOTO_COUNTER)
    }
    createInfo() {
        return new Promise(async (resolve, reject) => {
            let infoNode: Node = await AssetPool.Instance().createObjAsync('stageui/HeadInfo', 'HeadInfo');
            infoNode.parent = Global.game.node_container
            this.headTip = infoNode.getComponent(HeadTip)
            this.headTip.target = this
            this.headTip.changeState(HEAD_TIP_STATE.IDLE)
        })

    }
    onGotoCounterEnter() {
        let path = Global.game.map.getDrivePath();
        let newPath = path.slice(this.pathIndex, path.length - this.queueIndex * 3)
        this.lastPathIndex = this.pathIndex
        if (newPath.length > 0) {
            this.goto(newPath, () => {
                if (this.queueIndex == 0)
                    this.fsm.changeState(CAR_ACTION.WAITTING_FOOD)
                else
                    this.fsm.changeState(CAR_ACTION.WAITTING_IN_QUEUE)
            }, (val) => {
                this.pathIndex = val + this.lastPathIndex
            })
        } else {
            warn('customer path error')
        }
    }
    onGotoCounterUpdate(dt: number) {

    }
    onWaittingInQueueEnter() {

    }
    onWaittingInQueueUpdate(dt: number) {

    }
    onWattingFoodEnter() {

        AudioMgr.Instance().playSFX('car_horns_edit')
        let rnd = 1
        if (this.type == GameConst.CAR_TYPE.Normal)
            rnd = Math.floor(Math.random() * 3 + 1)
        else if (this.type == GameConst.CAR_TYPE.Supercar)
            rnd = Math.floor(Math.random() * 4 + 2)

        this.needFoodInfo = { type: ItemType.Package, count: rnd }
        this.headTip.changeState(HEAD_TIP_STATE.FOOD)
        this.node.emit(GameConst.EventType.UpdateHeadTip, this.needFoodInfo)

    }
    onWattingFoodUpdate(dt: number) {

    }
    onLeavingEnter() {
        this.node.emit(GameConst.EventType.Remove, this)

        let endNode = Global.game.map.getNodeByName('DrivePath').getChildByName('Path3')
        let path = [this.node.worldPosition.clone(), endNode.worldPosition.clone()];
        if (path.length > 0) {
            this.goto(path, () => {
                AssetPool.Instance().put(this.node)
            })
        } else {
            warn('customer path error')
        }
    }
    onLeavingUpdate(dt: number) {

    }
    shiftInQueue(index: number) {
        this.queueIndex = index
        this.fsm.changeState(CAR_ACTION.GOTO_COUNTER, true)
    }
    goto(path: Vec3[], callback: Function = null, updateFunc: Function = null) {
        this.moveEngine.speed = 2
        this.moveEngine.goto(path, callback, updateFunc)
        this.moveEngine.running = true
    }
    isOrding() {
        return this.fsm.isInState(CAR_ACTION.WAITTING_FOOD)
    }
    ownFood: number = 0

    addFood(item: any) {
        if (!this.fsm.isInState(CAR_ACTION.WAITTING_FOOD)) {
            warn('car不是点餐状态，错误')
            return
        }


        this.ownFood++

        Global.game.flyTo(item, this.node, this.node.worldPosition.clone(), 0.25, () => {
            AssetPool.Instance().put(item)
        })


        this.node.emit(GameConst.EventType.UpdateHeadTip, { type: this.needFoodInfo.type, count: this.needFoodInfo.count - this.ownFood })
        if (this.ownFood >= this.needFoodInfo.count) {
            this.ownFood = 0
            this.headTip.changeState(HEAD_TIP_STATE.IDLE)
            this.fsm.changeState(CAR_ACTION.LEAVING)
        }

    }
}


