

import { _decorator, Vec3, Label, Node, Prefab, instantiate, tween, v3, Quat, Tween } from 'cc';
import { MapItemBase } from './MapItemBase';
import Model from '../../../data/Model';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import FSM, { FSMAction } from '../../../utils/FSM';
import { CUSTOMER_ACTION } from '../Customer';
import GameConst, { FacilityAreaType, ItemType } from '../../../common/GameConst';
import { Role } from '../Role';
import { Player } from '../Player';
import { Item } from './Item';
import GuideManager from '../../guide/GuideManager';
import { AudioMgr } from '../../../utils/AudioMgr';

const { ccclass, property } = _decorator;

enum DESK_ACTION {
    IDLE,//等待坐满
    ING,//食物减少，由于是共同少食物，所以逻辑没有放顾客里面，放这
    LITTER,//纸团
}

@ccclass('Desk')
export class Desk extends MapItemBase {
    //数据
    data: { dirty: boolean, seats: number[] };
    fsm: FSM;

    //座子上物品位置
    private ItemGroup: Node = null;
    //钱位置
    private MoneyArea: Node = null;
    //椅子
    private Chairs: Node[] = [];

    //获取椅子模型和初始旋转角度
    private chairsModel: Node[] = []
    private chairsOrgRoation: Vec3[] = []

    foodDelay: number = 0
    foodDelayCount: number = 0

    //纸团
    litters: Node[] = [];

    isWindow: boolean = false

    start(): void {
        super.start();
        this.Chairs = this.GetGameObjects("Chair")

        let cModels = this.GetGameObject('model').children[0].children
        for (let i = 1; i < cModels.length; i++) {
            this.chairsModel.push(cModels[i])
            this.chairsOrgRoation.push(cModels[i].eulerAngles.clone())
        }

        let info = Model.game.deskInfo[this.cfg.Id];
        if (!info) {
            let seats = [];
            for (let i = 0; i < this.Chairs.length; i++) {
                seats.push(0);
            }
            info = { dirty: false, seats };
            Model.game.deskInfo[this.cfg.Id] = info;
        }
        this.data = info

        Global.game.map.desks.push(this);
        this.isWindow = this.cfg.Id >= 16 && this.cfg.Id <= 18
        this.initFsm()
        this.loadMoney()
    }
    async loadMoney() {
        await this.initMoney();
        let count = Model.game.moneyStack[100 + this.cfg.param]
        if (count && count > 0) {
            this.earnMoney = count
            this.createMoney();
        }
    }

    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, DESK_ACTION.IDLE, this.onIdleEnter, this.onIdleUpdate))
        this.fsm.addState(new FSMAction(this, DESK_ACTION.ING, this.onIngEnter, this.onIngUpdate))
        this.fsm.addState(new FSMAction(this, DESK_ACTION.LITTER, this.onLitterEnter, this.onLitterUpdate, this.onLitterExit))

        this.fsm.enterState(DESK_ACTION.IDLE)
    }

    //查询空位
    getEmptySeat(): { index: number, pos: Vec3, desk: Desk } {
        let info = Model.game.deskInfo[this.cfg.Id];
        if (!info) return null
        let index = info.seats.findIndex(a => a == 0);
        if (index == -1) return null
        return { index: index, pos: this.Chairs[index].worldPosition.clone(), desk: this }
    }


    refreshState() {
        super.refreshState();

        if (this.cfg.Id == 5) {
            if (this.unlockUI) this.unlockUI.node.active = this.checkCanUnlock()
        }
    }


    //顾客坐下
    customSitDown(index: number) {
        let info = Model.game.deskInfo[this.cfg.Id];
        info.seats[index] = 1;
    }
    //添加物品
    addItem(item: any) {
        let parent: Node = this.GetGameObject("ItemGroup") as Node;
        item.position = v3(0, this.stackList.length * 0.5, 0)
        item.parent = parent.children[1]
        this.stackList.push(item)

    }

    //检测是否坐满了
    checkSeatFull() {
        let index = this.data.seats.findIndex(a => a == 0);
        return index == -1
    }
    //检测该桌子上的所有顾客是否走吃好了
    checkFinished() {
        return this.fsm.isInState(DESK_ACTION.LITTER)
    }

    //顾客站起
    customStandUp(index: number) {
        let info = Model.game.deskInfo[this.cfg.Id];
        info.seats[index] = 0;
    }
    //由于是几个顾客等待一起吃饭，所以这来做定时器
    play() {
        this.fsm.changeState(DESK_ACTION.ING)
    }

    checkCanUnlock() {
        if (this.unlock) return false;
        if (this.cfg.Id == 5 && Model.game.guideID <= 13) return false
        if (Model.game.MoneyPutInfo[this.cfg.Id] >= this.cfg.MoneyCost) {
            // Model.game.ProgressIds.push(this.cfg.Id)
            return false
        }
        if (Model.game.ProgressIds.indexOf(this.cfg.PreLimit) != -1 || this.cfg.PreLimit == 0) {
            return true
        }
        return false
    }

    onIdleEnter() { }
    onIdleUpdate(dt: number) {

    }
    onIngEnter() {
        if (GuideManager.Instance().currentGuideId <= 11)
            this.foodDelay = Math.floor(Math.random() * 2 + 2)
        else
            this.foodDelay = Math.floor(Math.random() * 6 + 4)
        this.foodDelayCount = 0
    }
    onIngUpdate(dt: number) {
        this.foodDelayCount += dt
        if (this.foodDelayCount >= this.foodDelay) {
            this.foodDelayCount = 0
            if (this.stackList.length > 0) {
                let item = this.stackList.pop()
                AssetPool.Instance().put(item)
                this.addMoney()
                if (GuideManager.Instance().currentGuideId <= 11)
                    this.foodDelay = Math.floor(Math.random() * 2 + 2)
                else
                    this.foodDelay = Math.floor(Math.random() * 6 + 4)
            }
            if (this.stackList.length == 0) {
                this.fsm.changeState(DESK_ACTION.LITTER)
            }
        }
    }
    onLitterEnter() {
        this.createLitters()

        let ids = [16, 17, 18, 19, 20]//这几张椅子不旋转
        if (ids.indexOf(this.cfg.Id) != -1) return
        //椅子旋转一下
        for (let i = 0; i < this.chairsModel.length; i++) {
            let r = this.chairsOrgRoation[i]
            tween(this.chairsModel[i]).to(0.28, { eulerAngles: v3(r.x, r.y + Math.random() * 40 - 20, r.z) }, {}).start();
        }




    }
    async createLitters() {
        for (let i = 0; i < this.data.seats.length; i++) {
            let item = await AssetPool.Instance().createObjAsync('entity/Litter', 'Litter');
            item.position = v3(Math.random() * 0.6 - 0.3, 0, Math.random() * 0.6 - 0.3)
            item.parent = this.GetGameObject("ItemGroup").children[1]
            item.getComponent(Item).type = ItemType.Litter
            this.litters.push(item)
        }
        GuideManager.Instance().onEventTrigger('hasLitter')
    }
    reduceOne() {
        if (this.litters.length > 0) {
            let item = this.litters.pop()
            if (this.litters.length == 0)
                this.fsm.changeState(DESK_ACTION.IDLE)
            return item
        }
        return null
    }
    onLitterUpdate() {

    }
    onLitterExit() {
        let ids = [16, 17, 18, 19, 20]//这几张椅子不旋转
        if (ids.indexOf(this.cfg.Id) != -1) return
        //椅子还原
        for (let i = 0; i < this.chairsModel.length; i++) {
            tween(this.chairsModel[i]).to(0.28, { eulerAngles: this.chairsOrgRoation[i] }, {}).start();
        }
    }
    //检查桌子是否有垃圾
    get hasLitter() {
        return this.fsm.isInState(DESK_ACTION.LITTER)
    }
    //给小费
    async addMoney(customerType: number = 0) {
        let count = Math.floor(Math.random() * 5 + 4)
        if (customerType == GameConst.CUSTOME_TYPE.Boss)
            count = Math.floor(Math.random() * 8 + 6)
        this.earnMoney += count
        this.createMoney()
        Model.game.offsetMoneyStack(100 + this.cfg.param, count)
        Model.save()
    }


    initArea() {
        super.initArea()
        this.triggerAreaList.push({ type: FacilityAreaType.DESK_LITTER_POS, pos: this.node.worldPosition, dis: 2.5 })
        this.triggerAreaList.push({ type: FacilityAreaType.MONEY_COLLECTION, pos: this.GetGameObject('MoneyArea').worldPosition, dis: 1 })
    }
    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.DESK_LITTER_POS) {
            if (performance.now() - this.triggerTimeCount > 100) {
                this.triggerTimeCount = performance.now()
                if (role.canAdd(ItemType.Litter)) {
                    let ret = this.reduceOne()
                    if (ret) {
                        role.addOne(ret, this.litters.length)
                        this.scheduleOnce(() => {
                            GuideManager.Instance().onEventTrigger('onGetLitter')
                        }, 1)

                    }
                }

            }
        } else if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            if (role instanceof Player && this.earnMoney > 0 && !this.playReduceAni) {

                let player = Global.player
                player.addMoney(this.earnMoney)

                this.playMoneyReduceAni()
                Model.game.offsetMoneyStack(100 + this.cfg.param, -this.earnMoney)
                this.earnMoney = 0

            }
        } else {
            super.onTriggerStay(role, triggerType)
        }

    }
    onTriggerExit(role: Role, triggerType: number) {
        if (triggerType == FacilityAreaType.MONEY_COLLECTION) {
            super.onTriggerExit(role, triggerType)
            Model.save()
        } else {
            super.onTriggerExit(role, triggerType)
        }
    }
    //获取边缘位置
    getEdgePos() {
        let pos = this.node.worldPosition
        return [pos.clone().add(v3(0.8, 0, 0)), pos.clone().add(v3(-0.8, 0, 0)), pos.clone().add(v3(0, 0, 0.8)), pos.clone().add(v3(0, 0, -0.8))]
    }
    getNearPos(targetPos: Vec3) {
        let edge = this.getEdgePos()
        let max = 99999
        let min = null
        for (const temp of edge) {
            let v = v3()
            Vec3.subtract(v, targetPos, temp)
            let l = v.length()
            if (l < max) {
                max = l
                min = temp
            }
        }
        return min
    }
    getCenterPos() {
        return this.GetGameObject("ItemGroup").children[1].worldPosition.clone()
    }


}


