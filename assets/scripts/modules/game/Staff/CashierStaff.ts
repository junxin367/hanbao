import { _decorator, Component, Node, v3, log } from 'cc';
import { Global } from '../../../common/Global';
import Model from '../../../data/Model';
import { CashierDesk } from '../mapitems/CashierDesk';
import { BaseStaff, STAFF_ACTION } from './BaseStaff';

const { ccclass, property } = _decorator;

@ccclass('CashierStaff')
export class CashierStaff extends BaseStaff {
    table: CashierDesk;
    aidTime: number = 0
    start() {
        this.fsm.enterState(STAFF_ACTION.IDLE)
        this.node.eulerAngles = v3(0, 180, 0)
    }
    onIdleEnter() {
        this.ani.play('Player_Idle')
    }
    onIdleUpdate(dt: number) {
        if (this.table && this.table.hasFood() && Global.game.getFirstQueueCustomer()) {
            this.fsm.changeState(STAFF_ACTION.WORKING)
        }
    }
    onWorkingEnter() {
        this.ani.play('Package_work')
    }
    onWorkingUpdate(dt: number) {
        if (!this.table.hasFood() || Global.game.getFirstQueueCustomer() == null) {
            this.fsm.changeState(STAFF_ACTION.IDLE)
        }
    }
    onWorkingExit() {

    }
    update(deltaTime: number) {
        let customer = Global.game.getFirstQueueCustomer()
        if (customer&&customer.canAdd()) {
            this.aidTime += deltaTime
            let delayTime=Model.game.getCashierCounterProp()
            if (this.aidTime > delayTime) {
                let item = this.table.reduceOne()
                if (item) {
                    customer.addFood(item)
                    this.table.addMoney(customer.type)
                }

                this.aidTime = 0
            }
        }

    }
}


