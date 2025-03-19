import { _decorator, Component, Node, SkeletalAnimation, v3 } from 'cc';
import GameConst from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import FSM, { FSMAction } from '../../../utils/FSM';
import { GameManager } from '../GameManager';
import { MapItemBase } from '../mapitems/MapItemBase';
import { Role } from '../Role';
const { ccclass, property } = _decorator;

export enum STAFF_ACTION {
    IDLE = 0,
    GOTO_WORK = 1,             //去工作
    WORKING = 2,                //工作中    
    RESTING = 3,                //休息中,打盹
    CHECK=4,
    GOTO_REST_POINT=5,//去指定位置休息
}





//员工
@ccclass('BaseStaff')
export class BaseStaff extends Role {
    fsm: FSM
    delegate: GameManager

    ani:SkeletalAnimation
    onLoad() {
        this.ani=this.getComponent(SkeletalAnimation)
        this.initFsm()
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, STAFF_ACTION.IDLE, this.onIdleEnter, this.onIdleUpdate, this.onIdleExit))
        this.fsm.addState(new FSMAction(this, STAFF_ACTION.GOTO_WORK, this.onGoToWorkEnter, this.onGoToWorkUpdate, this.onGoToWorkExit))
        this.fsm.addState(new FSMAction(this, STAFF_ACTION.WORKING, this.onWorkingEnter, this.onWorkingUpdate, this.onWorkingExit))
        this.fsm.addState(new FSMAction(this, STAFF_ACTION.RESTING, this.onRestingEnter, this.onRestingUpdate, this.onRestingExit))
       // this.fsm.enterState(WORKER_ACTION.IDLE)
    }
    //空闲状态
    onIdleEnter() {

    }
    onIdleUpdate(dt: number) {
      
    }
    onIdleExit() {

    }
    //去工作，根据工作类型查找位置，寻路去
    onGoToWorkEnter() {

    }
    onGoToWorkUpdate(dt: number) {

    }
    onGoToWorkExit() {

    }
    //工作开始，根据类型做动画等
    onWorkingEnter() {

    }
    onWorkingUpdate(dt: number) {

    }
    onWorkingExit() {

    }
    onRestingEnter() {

    }
    onRestingUpdate(dt: number) {

    }
    onRestingExit() {

    }

  
    setProp(data: any) {
        
    }


   
}