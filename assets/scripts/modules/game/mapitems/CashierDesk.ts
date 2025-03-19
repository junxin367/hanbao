import { _decorator, Component, MeshRenderer, Node, v3, v4, Vec4, Tween, tween } from 'cc';
import GameConst, { FacilityAreaType, FacilityType, ItemType } from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import Model from '../../../data/Model';
import GuideManager from '../../guide/GuideManager';
import { Player } from '../Player';
import { Role } from '../Role';
import { Item } from './Item';
import { MapItemBase, } from './MapItemBase';
const { ccclass, property } = _decorator;

@ccclass('CashierDesk')
export class CashierDesk extends MapItemBase {


    @property(Node)
    cashierPlace: Node = null;





    update(deltaTime: number) {

    }


    addOne(item: Node = null, save: boolean = true) {
        if (item) {
            let parent = this.GetGameObject('Burger_1')
            let targetPos = v3(0, 0.5 * this.stackList.length)
            Global.game.flyTo(item, parent, parent.worldPosition.clone().add(targetPos.clone()), 0.25, () => {
                item.position = targetPos
                item.setRotationFromEuler(v3())
            })

            this.stackList.push(item)
            if (save)
                Model.game.offsetItemStack(FacilityAreaType.COUNTER_FOOD_PLACEMENT, 1)
        }
    }
    reduceOne() {
        if (this.stackList.length > 0) {
            let item = this.stackList.pop()
            Model.game.offsetItemStack(FacilityAreaType.COUNTER_FOOD_PLACEMENT, -1)
            return item
        }
        return null
    }
    async addMoney(customerType: number) {
        let count = 0
        if (customerType == GameConst.CUSTOME_TYPE.Normal)
            count = Math.floor(Math.random() * 3 + 8)
        else
            count = Math.floor(Math.random() * 5 + 24)
        this.earnMoney += count
        this.createMoney()
        Model.game.offsetMoneyStack(FacilityType.COUNTER, count)
        Model.save()
    }

    initArea() {
        super.initArea()
        this.triggerAreaList.push({ type: FacilityAreaType.COUNTER_FOOD_PLACEMENT, pos: this.GetGameObject('Burger_1').worldPosition, dis: 1.6 })
        this.triggerAreaList.push({ type: FacilityAreaType.COUNTER_SEND, pos: this.GetGameObject('Board').worldPosition, dis: 1.6 })
        this.triggerAreaList.push({ type: FacilityAreaType.MONEY_COLLECTION, pos: this.GetGameObject('MoneyArea').worldPosition, dis: 1.2 })

    }
    async onInit() {
        //已经解锁了收银员
        this.onUpgrade();
        await this.initMoney();
        this.loadMoney()
        this.loadItems()
    }

    loadMoney() {
        let count = Model.game.moneyStack[FacilityType.COUNTER]
        if (count && count > 0) {
            this.earnMoney = count
            this.createMoney();
        }
    }
    async loadItems() {
        let count = Model.game.itemStack[FacilityAreaType.COUNTER_FOOD_PLACEMENT]
        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
                let item = await AssetPool.Instance().createObjAsync('entity/Burger', 'Burger');
                this.addOne(item, false)
            }
        }
    }

    private _createdstaff = false;
    public onUpgrade() {
        if (this._createdstaff) return;
        if (Model.game.mapItemLv[this.cfg.Id + '_up'] >= 1) {
            this._createdstaff = true;
            Global.game.createCashierStaff(this.GetGameObject('model'), v3(0.376, 0, 1.229), this)

            let mat = this.Circle.getComponent(MeshRenderer).material
            mat.setProperty("mainColor", v4(0, 1, 0, 1))
        }
    }


    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.COUNTER_FOOD_PLACEMENT) {
            if (performance.now() - this.triggerTimeCount > 20) {
                this.triggerTimeCount = performance.now()
                if (role.canTake(ItemType.Burger)) {
                    let ret = role.reduceOne()
                    if (ret) {
                        this.addOne(ret)
                        this.scheduleOnce(() => {
                            GuideManager.Instance().onEventTrigger('onPutBurger')
                        }, 1)

                    }
                }

            }
        } else if (triggerType == FacilityAreaType.COUNTER_SEND) {
            if (role instanceof Player && performance.now() - this.triggerTimeCount > 1000) {
                this.triggerTimeCount = performance.now()
                let customer = Global.game.getFirstQueueCustomer()
                if (customer && customer.canAdd()) {
                    let item = this.reduceOne()
                    if (item) {
                        customer.addFood(item)
                        this.addMoney(customer.type)

                        this.scheduleOnce(() => {
                            GuideManager.Instance().onEventTrigger('onSellBurger')
                        }, 1)
                    }
                }
            }
        } else if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            if (role instanceof Player && this.earnMoney > 0 && !this.playReduceAni) {
                let player = Global.player
                player.addMoney(this.earnMoney)

                this.playMoneyReduceAni()
                Model.game.offsetMoneyStack(FacilityType.COUNTER, -this.earnMoney)
                this.earnMoney = 0

            }
        } else {
            super.onTriggerStay(role, triggerType)
        }

    }



    Circle: Node = null;
    onTriggerEnter(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.COUNTER_SEND && !this._createdstaff) {
            let mat = this.Circle.getComponent(MeshRenderer).material
            mat.setProperty("mainColor", v4(0, 1, 0, 1))

        } else {
            super.onTriggerEnter(role, triggerType)
        }
    }
    onTriggerExit(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.COUNTER_SEND) {
            if (!this._createdstaff) {
                let mat = this.Circle.getComponent(MeshRenderer).material
                mat.setProperty("mainColor", v4(1, 1, 1, 1))
            }
            Model.save()

        } else if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            super.onTriggerExit(role, triggerType)
            Model.save()
        } else {
            super.onTriggerExit(role, triggerType)
        }
    }


    hasFood() {
        return this.stackList.length > 0
    }
}


