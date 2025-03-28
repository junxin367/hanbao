import { _decorator, Component, Node, SkeletalAnimation, log, v3, find, Vec3, tween, Tween } from 'cc';
import { FacilityAreaType, ItemType } from '../../../common/GameConst';
import AssetPool from '../../../component/AssetPool';
import Model from '../../../data/Model';
import { AudioMgr } from '../../../utils/AudioMgr';
import FSM, { FSMAction } from '../../../utils/FSM';
import GuideManager from '../../guide/GuideManager';
import { Player } from '../Player';
import { Role } from '../Role';
import { Item } from './Item';
import { MapItemBase, } from './MapItemBase';
const { ccclass, property } = _decorator;
enum PROPMAKER_ACTION {
    IDLE = 1,
    WORKING = 2,
}

@ccclass('PropMaker')
export class PropMaker extends MapItemBase {
    private fsm: FSM
    private ani: SkeletalAnimation

    private prop: { lv: number, max: number, speed: number }

    itemPlaceNode: Node = null;
    private maxNode: Node = null;

    private pattyOrgPos: Vec3[]
    private timeCount: number = 0
    start() {

        this.ani = this.node.getComponent(SkeletalAnimation)
        this.itemPlaceNode = new Node()
        this.itemPlaceNode.parent = find("model/CoffeeMachine/Coffee", this.node)
        this.initFsm()
        this.initAni()
        super.start()
    }
    initAni() {
        this.pattyOrgPos = []
        let objs = ['patty', 'patty1', 'patty2']
        for (const key of objs) {
            let node = this.GetGameObject(key)
            this.pattyOrgPos.push(node.position.clone())

        }
    }
    onInit() {

        if (this.unlock) {
            let lv = Model.game.mapItemLv[this.cfg.Id + '_up'] || 0
            let info = Model.game.getBurgerMachineInfo(lv + 1)
            this.setAttr(info)
        }
        this.createMax()

    }
    async createMax() {
        let item = await AssetPool.Instance().createObjAsync('ui/Max', 'Max');
        item.parent = this.GetGameObject('Max');
        item.position = v3(0, 0, 0);
        this.maxNode = item;
        this.maxNode.active = false
    }
    onBuild() {
        this.onInit()
    }
    onUpgrade() {
        let lv = Model.game.mapItemLv[this.cfg.Id + '_up'] || 0
        let info = Model.game.getBurgerMachineInfo(lv + 1)
        this.setAttr(info)
        this.maxNode.active = false
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, PROPMAKER_ACTION.IDLE, this.onIdleEnter, this.onIdleUpdate, this.onIdleExit))
        this.fsm.addState(new FSMAction(this, PROPMAKER_ACTION.WORKING, this.onWorkingEnter, this.onWorkingUpdate, this.onWorkingExit))
    }
    onIdleEnter() {
        this.resetAni()
    }
    onIdleUpdate(dt: number) {
        if (this.stackList.length < this.prop.max) {
            this.fsm.changeState(PROPMAKER_ACTION.WORKING)
        }
    }
    onIdleExit() {

    }
    onWorkingEnter() {
        this.playAni()
        this.timeCount = 0
    }
    async onWorkingUpdate(dt: number) {
        this.timeCount += dt
        if (this.timeCount > this.prop.speed) {
            await this.addOne()
            if (this.stackList.length >= this.prop.max) {
                this.fsm.changeState(PROPMAKER_ACTION.IDLE)
                this.maxNode.active = true
            }
            this.timeCount = 0
        }

    }
    onWorkingExit() {

    }
    async setAttr(val: any) {
        this.prop = val;
      
        
        this.fsm.changeState(PROPMAKER_ACTION.IDLE)

    }

    async addOne() {
        let idx = this.itemPlaceNode.children.length
        let item = await AssetPool.Instance().createObjAsync('entity/Burger', 'Burger');
        item.position = v3(0, Math.floor(idx / 2) * 0.3, idx % 2 == 0 ? -0.3 : 0.3)
        item.parent = this.itemPlaceNode
        item.getComponent(Item).type = ItemType.Burger
        item.setRotationFromEuler(v3())
        this.stackList.push(item)
        this.resort()

    }

    resort() {
        for (let i = 0; i < this.stackList.length; i++) {
            let item = this.stackList[i]
            item.position = v3(0, Math.floor(i / 2) * 0.3, i % 2 == 0 ? -0.3 : 0.3)
        }
    }

    playAni() {
        let objs = ['patty', 'patty1', 'patty2']
        for (let i = 0; i < objs.length; i++) {
            let p = this.pattyOrgPos[i]
            this.GetGameObject(objs[i]).setPosition(p.clone())
            Tween.stopAllByTarget(this.GetGameObject(objs[i]))
            tween(this.GetGameObject(objs[i])).delay(i * 0.5 + 0.1).by(0.5, { position: v3(0, 0.5, 0), eulerAngles: v3(0, 0, 180) }).by(0.5, { position: v3(0, -0.5, 0) }).union().repeatForever().start()
        }
    }
    resetAni() {
        let objs = ['patty', 'patty1', 'patty2']
        for (let i = 0; i < objs.length; i++) {
            let p = this.pattyOrgPos[i]
            Tween.stopAllByTarget(this.GetGameObject(objs[i]))
            this.GetGameObject(objs[i]).setPosition(p.clone())
        }
    }

    reduceOne() {
        if (this.stackList.length > 0) {
            let item = this.stackList.pop()
            this.maxNode.active = false
            return item
        }
        return null;
    }



    initArea() {
        super.initArea()
        this.triggerAreaList.push({ type: FacilityAreaType.PRODUCTION, pos: this.itemPlaceNode.worldPosition, dis: 1 })
    }
    onTriggerEnter(role: Role, triggerType: number) {
        super.onTriggerEnter(role, triggerType)
        if (role instanceof Player && triggerType == FacilityAreaType.PRODUCTION) {
            AudioMgr.Instance().playSFX('HamburgersFryOnGri')
        }

    }

    onTriggerExit(role: Role, triggerType: number) {
        super.onTriggerExit(role, triggerType)
        if (role instanceof Player && triggerType == FacilityAreaType.PRODUCTION) {
            AudioMgr.Instance().stopSFXAll()
        }

    }
    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.PRODUCTION) {
            if (performance.now() - this.triggerTimeCount > 100) {
                this.triggerTimeCount = performance.now()
                if (role.canAdd(ItemType.Burger)) {
                    let ret = this.reduceOne()
                    if (ret) {
                        role.addOne(ret, this.stackList.length)
                        this.scheduleOnce(() => {
                            GuideManager.Instance().onEventTrigger('onGetBurger')
                        }, 1)

                    }
                }

            }
        } else {
            super.onTriggerStay(role, triggerType)
        }

    }
}


