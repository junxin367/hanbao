import { _decorator, Component, MeshRenderer, Node, v3, v4 } from 'cc';
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

@ccclass('DriveCarTable')
export class DriveCarTable extends MapItemBase {

    initArea() {
        super.initArea()

        this.triggerAreaList.push({ type: FacilityAreaType.DRIVE_THRU_PLACEMENT, pos: this.GetGameObject('DPackageTable_1').worldPosition, dis: 1.5 })
        this.triggerAreaList.push({ type: FacilityAreaType.DRIVE_THRU_SEND, pos: this.GetGameObject('Board').worldPosition, dis: 2 })
        this.triggerAreaList.push({ type: FacilityAreaType.MONEY_COLLECTION, pos: this.GetGameObject('MoneyArea').worldPosition, dis: 1.2 })


    }

    onInit(): void {

        this.onUpgrade();

        this.loadMoney();
        this.loadItems()
    }
    async loadMoney() {
        await this.initMoney()
        let count = Model.game.moneyStack[FacilityType.DRIVE_THRU]
        if (count && count > 0) {
            this.earnMoney = count
            this.createMoney();
        }
    }
    async initMoney() {
        let moneyArea = this.GetGameObject('MoneyArea')
        for (let i = 0; i < 8; i++) {
            let item = await AssetPool.Instance().createObjAsync('entity/Money', 'Money');
            let idx = this.moneyStack.length
            item.position = v3(-Math.floor(idx / 4) % 2 * 0.65 + 0.5, Math.floor(idx / 8) * 0.1, idx % 8 % 4 * 0.35 - 0.5)
            item.parent = moneyArea
            item.getComponent(Item).type = ItemType.Money
            this.moneyStack.push(item)
            item.active = false
        }
    }
    async loadItems() {
        let count = Model.game.itemStack[FacilityAreaType.DRIVE_THRU_PLACEMENT]
        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
                let item = await AssetPool.Instance().createObjAsync('entity/Package', 'Package');
                this.addOne(item,false)
            }
        }
    }

    private _createdstaff = false;
    public onUpgrade() {
        if (this._createdstaff) return;
        if (Model.game.mapItemLv[this.cfg.Id + '_up'] >= 1) {
            this._createdstaff = true;
            Global.game.createDriveCarStaff(this.GetGameObject('model'), v3(0 - 1.046, 0, 0), this)
            let mat = this.Circle.getComponent(MeshRenderer).material
            mat.setProperty("mainColor", v4(0, 1, 0, 1))
        }
    }

    onTriggerStay(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.DRIVE_THRU_PLACEMENT) {
            if (!this.unlock) return;
            if (performance.now() - this.triggerTimeCount > 100) {
                this.triggerTimeCount = performance.now()

                if (role.canTake(ItemType.Package)) {
                    let item = role.reduceOne()
                    if (item) {
                        this.addOne(item)
                        if (role instanceof Player) {
                            this.scheduleOnce(() => {
                                GuideManager.Instance().onEventTrigger('onPutBox')
                            }, 1)

                        }
                    }
                }


            }
        } else if (triggerType == FacilityAreaType.DRIVE_THRU_SEND) {
            if (!this.unlock) return;
            if (role instanceof Player && performance.now() - this.triggerTimeCount > 2000) {
                this.triggerTimeCount = performance.now()
                let car = Global.game.getFirstQueueCar()
                if (car) {
                    let item = this.reduceOne()
                    if (item) {
                        car.addFood(item)
                        this.addMoney(car.type)
                    }
                }
            }
        } else if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            if (!this.unlock) return;
            if (role instanceof Player && this.earnMoney > 0 && !this.playReduceAni) {
                let player = Global.player
                player.addMoney(this.earnMoney)

                this.playMoneyReduceAni()
                Model.game.offsetMoneyStack(FacilityType.DRIVE_THRU, -this.earnMoney)
                this.earnMoney = 0
            }
        }
        else {
            super.onTriggerStay(role, triggerType)
        }

    }

    Circle: Node = null;
    onTriggerEnter(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.DRIVE_THRU_SEND && !this._createdstaff) {
            let mat = this.Circle.getComponent(MeshRenderer).material
            mat.setProperty("mainColor", v4(0, 1, 0, 1))
        } else {
            super.onTriggerEnter(role, triggerType)
        }
    }
    onTriggerExit(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.DRIVE_THRU_SEND && !this._createdstaff) {
            let mat = this.Circle.getComponent(MeshRenderer).material
            mat.setProperty("mainColor", v4(1, 1, 1, 1))
        } else if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            super.onTriggerExit(role, triggerType)
            Model.save()
        } else {
            super.onTriggerExit(role, triggerType)
        }
    }



    addOne(item: Node, save: boolean = true) {
        if (item) {
            let parent = this.GetGameObject('Items_1')
            let targetPos = v3(0, 0.5 * this.stackList.length)
            Global.game.flyTo(item, parent, parent.worldPosition.clone().add(targetPos.clone()), 0.25, () => {
                item.position = targetPos
                item.setRotationFromEuler(v3())
            })
            this.stackList.push(item)
            if (save)
                Model.game.offsetItemStack(FacilityAreaType.DRIVE_THRU_PLACEMENT, 1)
        }
    }
    reduceOne() {
        if (this.stackList.length > 0) {
            let item = this.stackList.pop()
            Model.game.offsetItemStack(FacilityAreaType.DRIVE_THRU_PLACEMENT, -1)
            return item
        }
        return null
    }
    async addMoney(type: number) {
        let count = 0
        if (type == GameConst.CAR_TYPE.Normal)
            count = Math.floor(Math.random() * 3 + 8) * 2
        else
            count = Math.floor(Math.random() * 5 + 14) * 2
        this.earnMoney += count
        this.createMoney()
        Model.game.offsetMoneyStack(FacilityType.DRIVE_THRU, count)
        Model.save()
    }


    hasFood() {
        return this.stackList.length > 0
    }
}