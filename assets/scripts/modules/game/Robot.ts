import { _decorator, Component, Node, Vec3, v3, tween, Color } from 'cc';
import { BOOST_TYPE } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import Model from '../../data/Model';
import FSM, { FSMAction } from '../../utils/FSM';
import { MovePath } from './MovePath';
import { Role } from './Role';
const { ccclass, property } = _decorator;
export enum ROBOT_ACTION {
    NO_ENGRY,
    IDLE,
    GOTO_WORK,
    WORKING,
    BACK,
}
@ccclass('Robot')
export class Robot extends Role {
    private moveEngine: MovePath
    private fsm: FSM

    onLoad() {
        this.key = 'robot'
        this.moveEngine = this.node.addComponent(MovePath)
        this.initFsm()
        this.cleanAll()
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, ROBOT_ACTION.NO_ENGRY, this.onNoEngryEnter, this.onNoEngryUpdate))
        this.fsm.addState(new FSMAction(this, ROBOT_ACTION.GOTO_WORK, this.onGotoWorkEnter, this.onGotoWorkUpdate))
        this.fsm.addState(new FSMAction(this, ROBOT_ACTION.WORKING, this.onWorkingEnter, this.onWorkingUpdate))
        this.fsm.addState(new FSMAction(this, ROBOT_ACTION.IDLE, this.onIdleEnter, this.onIdleUpdate))
        this.fsm.addState(new FSMAction(this, ROBOT_ACTION.BACK, this.onBackEnter, this.onBackUpdate))
    }
    start() {

        this.fsm.changeState(ROBOT_ACTION.IDLE)
    }

    onNoEngryEnter() {

    }
    onNoEngryUpdate(dt: number) {

    }
    onGotoWorkEnter() {
        let desk = Global.game.map.getSeatWithLitter()
        let nearPos=desk.getNearPos(this.node.worldPosition.clone())
        let path = Global.game.map.findPath(nearPos, desk.node.worldPosition.clone());
        if (path.length > 0) {
            this.goto(path, () => {
                this.fsm.changeState(ROBOT_ACTION.WORKING)
            })
        }
    }
    onGotoWorkUpdate(dt: number) {

    }
    onWorkingEnter() {
        this.aidTime=0
    }
    aidTime=0
    onWorkingUpdate(dt: number) {
        this.aidTime+=dt
        if(this.aidTime >=1)
        {
            this.aidTime=0
            let desk = Global.game.map.getSeatWithLitter()
            if (desk) {
                this.fsm.changeState(ROBOT_ACTION.GOTO_WORK)
            } else {
                this.fsm.changeState(ROBOT_ACTION.BACK)
            }
        }
       
    }
    onIdleEnter() {

    }
    onIdleUpdate(dt: number) {
        if (!Global.game || !Global.game.map || !this.node.parent.active) return
        let t= Model.game.boost[BOOST_TYPE.CLEAN_BOT]||0
        if(t<=0)return
        let desk = Global.game.map.getSeatWithLitter()
        if (desk) {
            this.fsm.changeState(ROBOT_ACTION.GOTO_WORK)
        }
    }
    onBackEnter() {
        let endNode = Global.game.map.getNodeByName('CleanerArea')
        let path = Global.game.map.findPath(this.node.worldPosition, endNode.worldPosition.clone());
        if (path.length > 0) {
            this.goto(path, () => {
                this.cleanAll()
                this.fsm.changeState(ROBOT_ACTION.IDLE)
                tween(this.node).to(0.5, { eulerAngles: v3(0, -180, 0), position: v3(0, 0.08333, -0.2) }, {}).start();
            })
        }
    }
    onBackUpdate(dt: number) {
        let desk = Global.game.map.getSeatWithLitter()
        if (desk) {
            this.fsm.changeState(ROBOT_ACTION.GOTO_WORK)
        }
    }
    goto(path: Vec3[], callback: Function = null) {
        this.moveEngine.speed = 1.5
        this.moveEngine.goto(path, callback, null, 90)
        this.moveEngine.running = true
    }
    addOne(item: Node) {
       
        Global.game.flyTo(item, this.node, this.GetGameObject('Item').worldPosition.clone(), 0.25, () => {
            AssetPool.Instance().put(item)
            this.GetGameObject('Item').active = true
        })

    }
    cleanAll() {
        this.GetGameObject('Item').active = false
    }
    update(dt) {
        super.update(dt)
        let t= Model.game.boost[BOOST_TYPE.CLEAN_BOT]||0
        if (t <= 0) {
            this.fsm.changeState(ROBOT_ACTION.IDLE)
        }
    }
}


