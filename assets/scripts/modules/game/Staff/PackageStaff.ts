import { _decorator, Component, Node } from 'cc';
import Model from '../../../data/Model';
import { PackageTable } from '../mapitems/PackageTable';
import { BaseStaff, STAFF_ACTION } from './BaseStaff';

const { ccclass, property } = _decorator;

@ccclass('PackageStaff')
export class PackageStaff extends BaseStaff {
    aidTime: number = 0
    table: PackageTable
    start() {
        this.fsm.enterState(STAFF_ACTION.IDLE)
    }
    onIdleEnter() {
        this.ani.play('Player_Idle')
    }
    onIdleUpdate(dt: number) {
        if (this.table && this.table.hasFood()) {
            this.fsm.changeState(STAFF_ACTION.WORKING)
        }
    }
    onWorkingEnter() {
        this.ani.play('Package_work')
    }
    onWorkingUpdate(dt: number) {
        if (!this.table.hasFood()) {
            this.fsm.changeState(STAFF_ACTION.IDLE)
        }
    }
    onWorkingExit() {

    }

    update(deltaTime: number) {
        this.aidTime += deltaTime
        let delay=Model.game.getPackageCounterProp()
        if (this.aidTime > delay) {
            this.table.packageFood()
            this.aidTime = 0
        }
    }
}


