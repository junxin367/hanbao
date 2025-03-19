import { _decorator, Component, MeshRenderer, Node, v3, v4 } from 'cc';
import { FacilityAreaType, FacilityType, ItemType } from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import { Role } from '../Role';
import { Item } from './Item';
import { MapItemBase, } from './MapItemBase';
import Model from '../../../data/Model';
import { Player } from '../Player';
import GuideManager from '../../guide/GuideManager';
const { ccclass, property } = _decorator;
//打包台
@ccclass('PackageTable')
export class PackageTable extends MapItemBase {
    private packageNum = 0
    private packageBoxStack: Node[] = []
    initArea() {
        super.initArea()
        this.triggerAreaList.push({ type: FacilityAreaType.PACKAGE_FOOD_PLACEMENT, pos: this.GetGameObject('PackageTable_2_3step').worldPosition, dis: 1.5 })
        this.triggerAreaList.push({ type: FacilityAreaType.PACKAGE_BOX, pos: this.GetGameObject('packageBox').worldPosition, dis: 1 })
    }

    onInit() {
        if (this.unlock) {
            this.onUpgrade();
            for (let i = 1; i <= 4; i++) {
                this.GetGameObject('Coffee' + i).active = false
            }
            this.loadItems();
            this.loadPackage();
        }
    }
    onBuild() {
        this.onInit()
    }
    async loadItems() {
        let count = Model.game.itemStack[FacilityAreaType.PACKAGE_FOOD_PLACEMENT]
        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
                let item = await AssetPool.Instance().createObjAsync('entity/Burger', 'Burger');
                this.addOne(item, false)
            }
        }
    }
    async loadPackage() {
        let count = Model.game.itemStack[FacilityAreaType.PACKAGE_BOX]
        if (count && count > 0) {
            for (let i = 0; i < count; i++) {
               this.addPackage(false)
            }
        }
    }

    Circle: Node = null;
    private _createdstaff = false;
    onUpgrade(): void {
        if (this._createdstaff) return;
        this._createdstaff = true;
        Global.game.createPackageStaff(this.GetGameObject('model'), v3(0, 0, -1.36), this)

        let mat = this.Circle.getComponent(MeshRenderer).material
        mat.setProperty("mainColor", v4(0, 1, 0, 1))
    }

    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.PACKAGE_FOOD_PLACEMENT) {
            if (!this.unlock) return;
            if (performance.now() - this.triggerTimeCount > 100) {
                this.triggerTimeCount = performance.now()
                if (role.canTake(ItemType.Burger)) {
                    let ret = role.reduceOne(ItemType.Burger)
                    if (ret) {
                        this.addOne(ret)
                        if (role instanceof Player) {


                            this.scheduleOnce(() => {
                                GuideManager.Instance().onEventTrigger('onPutBurgerToPackage')
                            }, 1)
                        }
                    }
                }
            }
        } else if (triggerType == FacilityAreaType.PACKAGE_BOX) {
            if (!this.unlock) return;
            //搬运
            if (performance.now() - this.triggerTimeCount > 100) {
                this.triggerTimeCount = performance.now()
                if (this.packageBoxStack.length > 0) {
                    if (role.canAdd((ItemType.Package))) {
                        let box = this.packageBoxStack.pop()
                        role.addOne(box, this.packageBoxStack.length)
                        Model.game.offsetItemStack(FacilityAreaType.PACKAGE_BOX, -1)
                        if (role instanceof Player) {

                            this.scheduleOnce(() => {
                                GuideManager.Instance().onEventTrigger('onGetBurgerBox')
                            }, 1)
                        }
                    }

                }


            }
        }
        else {
            super.onTriggerStay(role, triggerType)
        }

    }
    addOne(item: Node, save: boolean = true) {
        if (item) {
            let parent = this.GetGameObject('Burger')
            let targetPos = v3(0, 0.5 * this.stackList.length, 0)
            Global.game.flyTo(item, parent, parent.worldPosition.clone().add(targetPos.clone()), 0.25, () => {
                item.position = targetPos
                item.setRotationFromEuler(v3())
            })
            this.stackList.push(item)
            if (save)
                Model.game.offsetItemStack(FacilityAreaType.PACKAGE_FOOD_PLACEMENT, 1)
        }
    }
    reduceOne() {
        if (this.stackList.length > 0) {
            let item = this.stackList.pop()
            Model.game.offsetItemStack(FacilityAreaType.PACKAGE_FOOD_PLACEMENT, -1)
            return item
        }
        return null;
    }

    hasFood() {
        return this.stackList.length > 0
    }

    packageFood() {
        let item = this.reduceOne()
        if (item) {
            AssetPool.Instance().put(item)//to do
            this.packageNum++
            this.GetGameObject('Coffee' + this.packageNum).active = true
            if (this.packageNum >= 4) {
                for (let i = 1; i <= 4; i++) {
                    this.GetGameObject('Coffee' + i).active = false
                }
                this.packageNum = 0
                this.addPackage()
            }
        }

    }
    //添加打包好的
    async addPackage(save: boolean = true) {
        let node: Node = await AssetPool.Instance().createObjAsync('entity/Package', 'Package');
        node.parent = this.GetGameObject('CoffeePackage')

        let parent = this.GetGameObject('Items')
        let targetPos = v3(0, this.packageBoxStack.length * 0.4, 0)

        Global.game.flyTo(node, parent, parent.worldPosition.clone().add(targetPos.clone()), 0.25, () => {
            node.position = targetPos
        })

        node.getComponent(Item).type = ItemType.Package
        this.packageBoxStack.push(node)
        if (save)
            Model.game.offsetItemStack(FacilityAreaType.PACKAGE_BOX, 1)

        GuideManager.Instance().onEventTrigger('onPackageBox')
    }
    hasPackageBox() {
        return this.packageBoxStack.length > 0
    }
}