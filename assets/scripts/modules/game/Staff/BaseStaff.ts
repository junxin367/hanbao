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
    GOTO_WORK = 1,             
    WORKING = 2,                
    RESTING = 3,                
    CHECK=4,
    GOTO_REST_POINT=5,
}






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

    }

    onIdleEnter() {

    }
    onIdleUpdate(dt: number) {
      
    }
    onIdleExit() {

    }

    onGoToWorkEnter() {

    }
    onGoToWorkUpdate(dt: number) {

    }
    onGoToWorkExit() {

    }

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