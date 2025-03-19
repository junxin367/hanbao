import { _decorator, Component, Node, v3 } from 'cc';
import { Global } from '../../../common/Global';
import Model from '../../../data/Model';
import { DriveCarTable } from '../mapitems/DriveCarTable';
import { BaseStaff, STAFF_ACTION } from './BaseStaff';

const { ccclass, property } = _decorator;
//得来速固定员工
@ccclass('DriveCarStaff')
export class DriveCarStaff extends BaseStaff {
    table: DriveCarTable;
    aidTime: number = 0
    start() {
        this.fsm.enterState(STAFF_ACTION.IDLE)
        this.node.eulerAngles = v3(0, 90, 0)
    }
    onIdleEnter() {
        this.ani.play('Player_Idle')
    }
    onIdleUpdate(dt: number) {
        if (this.table && this.table.hasFood() && Global.game.getFirstQueueCar()) {
            this.fsm.changeState(STAFF_ACTION.WORKING)
        }
    }
    onWorkingEnter() {
        this.ani.play('Package_work')
    }
    onWorkingUpdate(dt: number) {
        if (!this.table.hasFood() || Global.game.getFirstQueueCar() == null) {
            this.fsm.changeState(STAFF_ACTION.IDLE)
        }
    }
    onWorkingExit() {

    }

    update(deltaTime: number) {
        let car = Global.game.getFirstQueueCar()
        if (car) {
            this.aidTime += deltaTime
            let delay=Model.game.getDriveCarCounterProp()
            if (this.aidTime >delay) {//这个时间升级后会变动
                let item = this.table.reduceOne()
                if (item) {
                    car.addFood(item)
                    this.table.addMoney(car.type)
                }

                this.aidTime = 0
            }
        }

    }
}