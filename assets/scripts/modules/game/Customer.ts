import { _decorator, Component, Node, Vec3, v3, find, log, warn, SkeletalAnimation, Camera, Color, quat, Quat, MeshRenderer, v4, TERRAIN_HEIGHT_BASE } from 'cc';
import GameConst, { FacilityID, ItemType } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import FSM, { FSMAction } from '../../utils/FSM';
import { GuideArrow } from '../guide/GuideArrow';
import { HeadTip, HEAD_TIP_STATE } from './HeadTip';
import { Desk } from './mapitems/Desk';
import { MoveBase } from './MoveBase';
import { MovePath } from './MovePath';
import { Role } from './Role';
import { SleepEffect } from './SleepEffect';
const { ccclass, property } = _decorator;

let v3_0 = v3()
let v3_1 = v3()
let qt_0 = quat()
let qt_1 = quat()

export enum CUSTOMER_ACTION {
    GOTO_ORDER_STATION,       //去点餐台
    WAITTING_IN_QUEUE,        //等待点餐，排队中
    ANGRY,                    //排队中有点打电话，愤怒
    ORDING,                   //点餐中，必须等待自己点的数量够了
    CHECK_SEAT,               //检测是否有空位
    GOTO_TABLE,               //拿桌食物去桌子吃饭
    WAITTING_PARTNER,         //等待同伴到来
    EATING,                   //吃饭中
    LEAVING,                  //离开
    PHONE,                    //打电话，捣乱顾客   
    SLEEPING,                 //睡着了
}

//顾客
@ccclass('Customer')
export class Customer extends Role {
    fsm: FSM
    moveEngine: MovePath
    delegate: any;
    private ani: SkeletalAnimation
    queueIndex: number = -1

    //需要的食物信息
    needFoodInfo: { type: number, count: number }
    ownFood: number = 0
    seatInfo: { index: number, pos: Vec3, desk: Desk }

    //装食物的节点
    foodNode: Node
    stackList: Node[]

    //吃饭时间
    eattingTime: number = 0
    eattingTimeCount: number = 0

    headTip: HeadTip


    private angryTimeCount: number = 0
    private angryTimeDelay: number = 0
    phoneQueueIndex: number = -1//打电话的时候所在索引

    private _type: number = GameConst.CUSTOME_TYPE.Normal;

    onLoad() {
        this.ani = this.node.getComponent(SkeletalAnimation)
        this.foodNode = find('Customer01/Item', this.node)
        this.moveEngine = this.node.addComponent(MovePath)
        this.stackList = []
        this.createInfo()
        this.initFsm()
    }
    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.GOTO_ORDER_STATION, this.onGotoOrderStationEnter, this.onGotoOrderStationUpdate, this.onGotoOrderStationExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.WAITTING_IN_QUEUE, this.onWaittingInQueueEnter, this.onWaittingInQueueUpdate, this.onWaittingInQueueExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.CHECK_SEAT, this.onCheckSeatEnter, this.onCheckSeatUpdate, this.onCheckSeatExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.ANGRY, this.onAngryEnter, this.onAngryUpdate))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.ORDING, this.onOrdingEnter, this.onOrdingUpdate, this.onOrdingExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.GOTO_TABLE, this.onGotoTableEnter, this.onGotoTableUpdate, this.onGotoTableExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.EATING, this.onEattingEnter, this.onEattingUpdate, this.onEattingExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.WAITTING_PARTNER, this.onWattingPartnerEnter, this.onWattingPartnerUpdate, this.onWattingPartnerExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.LEAVING, this.onLeavingEnter, this.onLeavingUpdate, this.onLeavingExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.PHONE, this.onPhoneEnter, this.onPhoneUpdate, this.onPhoneExit))
        this.fsm.addState(new FSMAction(this, CUSTOMER_ACTION.SLEEPING, this.onSleepingEnter, this.onSleepingUpdate))


    }
    onEnable() {
        this.GetGameObject('Stage01_Skin_2').active = false
        this.GetGameObject('Stage01_Skin_1').active = false
        this.GetGameObject('Stage01_Skin').active = false

        let mat = this.GetGameObject('main_Character').getComponent(MeshRenderer).material
        // mat.setProperty('albedo', v4(0.392, 0.392, 0.392, 1))


        this.stackList.length=0
        this.queueIndex=-1
        this.needFoodInfo=null
        this.ownFood=0
        
    }
    createInfo() {
        return new Promise(async (resolve, reject) => {
            let infoNode: Node = await AssetPool.Instance().createObjAsync('stageui/HeadInfo', 'HeadInfo');
            infoNode.parent = Global.game.node_container
            this.headTip = infoNode.getComponent(HeadTip)
            this.headTip.target = this
            this.headTip.changeState(HEAD_TIP_STATE.IDLE)
        })

    }

    run(index: number) {
        this.queueIndex = index
        this.fsm.enterState(CUSTOMER_ACTION.GOTO_ORDER_STATION)
    }

    onGotoOrderStationEnter() {
        //计算要移动到的位置todo
        let endNode = find('stage01_cocos/CustomerPath/Path2_1', this.delegate.sceneNode)
        let endPos = v3()
        let idx = this.queueIndex
        Vec3.subtract(endPos, endNode.worldPosition, v3(0, 0, idx * 1.5))
        let path = this.delegate.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {



            this.goto(path, () => {
                if (this.type == GameConst.CUSTOME_TYPE.Calling) {
                    this.fsm.changeState(CUSTOMER_ACTION.PHONE)
                } else {
                    if (this.queueIndex == 0)
                        this.fsm.changeState(CUSTOMER_ACTION.ORDING)
                    else
                        this.fsm.changeState(CUSTOMER_ACTION.WAITTING_IN_QUEUE)
                }

            })
        } else {
            warn('customer path error')
        }

    }
    onGotoOrderStationUpdate(dt: number) {

    }
    onGotoOrderStationExit() {

    }
    //排队中
    onWaittingInQueueEnter() {

    }
    wattingTimeCount = 0
    onWaittingInQueueUpdate(dt: number) {
        //如果排队过程中前面有捣乱顾客，则需要发表情
        this.wattingTimeCount += dt
        if (this.wattingTimeCount > 1) {
            let ruleBreakerIdx = Global.game.getCallingCustomerIndex()
            if (ruleBreakerIdx != -1 && this.queueIndex > ruleBreakerIdx) {
                this.fsm.changeState(CUSTOMER_ACTION.ANGRY)
            }
            this.wattingTimeCount = 0
        }


    }
    onWaittingInQueueExit() {

    }
    onAngryEnter() {
        this.angryTimeCount = 0
        this.angryTimeDelay = Math.random() * 2 + 1
        this.headTip.changeState(HEAD_TIP_STATE.ANGRY)
    }
    onAngryUpdate(dt: number) {
        this.angryTimeCount += dt
        if (this.angryTimeCount > this.angryTimeDelay) {
            this.angryTimeCount = 0
            this.fsm.changeState(CUSTOMER_ACTION.WAITTING_IN_QUEUE)

        }
    }

    //点餐状态
    onOrdingEnter() {

        let rnd = Math.floor(Math.random() * 2 + 1)
        if (this.type == GameConst.CUSTOME_TYPE.Boss)
            rnd = Math.floor(Math.random() * 5 + 5)
        this.needFoodInfo = { type: ItemType.Burger, count: rnd }

        this.headTip?.changeState(HEAD_TIP_STATE.FOOD)
        this.node.emit(GameConst.EventType.UpdateHeadTip, this.needFoodInfo)
    }
    onOrdingUpdate(dt: number) {

    }
    onOrdingExit() {

    }
    onCheckSeatEnter() {
        Global.game.eattingCustomer.push(this)
    }
    onCheckSeatUpdate(dt: number) {
        let seatInfo = Global.game.map.getEmptySeat()
        if (seatInfo == null) {
            //文本显示没有座位            
            this.headTip.changeState(HEAD_TIP_STATE.NO_SEAT)
        } else {
            this.seatInfo = seatInfo
            this.seatInfo.desk.customSitDown(this.seatInfo.index)//这个时候就要把位置占用了
            this.fsm.changeState(CUSTOMER_ACTION.GOTO_TABLE)
        }
    }
    onCheckSeatExit() {

    }
    //走路去座位吃饭
    onGotoTableEnter() {
        this.headTip.changeState(HEAD_TIP_STATE.IDLE)
        Global.game.removeCustomerFormQueue(this)
        //查找路径，启动寻路
        let path = this.delegate.map.findPath(this.node.worldPosition, this.seatInfo.pos);
        if (path.length > 0) {

            this.goto(path, () => {
                this.fsm.changeState(CUSTOMER_ACTION.WAITTING_PARTNER)
            })
        } else {
            warn('customer path error')
        }
    }
    onGotoTableUpdate(dt: number) {

    }
    onGotoTableExit() {

    }
    //等待同伴到来再吃
    onWattingPartnerEnter() {
        //坐到桌子上
        //旋转
        let pos = new Vec3();
        Vec3.subtract(pos, this.seatInfo.desk.getCenterPos(), this.node.worldPosition);
        Vec3.normalize(pos, pos);
        const targetRotation = Math.atan2(pos.x, pos.z) * 180 / Math.PI;
        Quat.fromEuler(qt_0, 0, targetRotation, 0)
        this.node.setRotation(qt_0)

        this.node.worldPosition = this.seatInfo.pos.clone();
        //添加食物到桌子上
        for (let i = 0; i < this.stackList.length; i++) {
            this.seatInfo.desk.addItem(this.stackList[i])
        }
        this.stackList.length = 0
    }
    onWattingPartnerUpdate(dt: number) {
        if (this.seatInfo.desk.checkSeatFull()) {
            this.fsm.changeState(CUSTOMER_ACTION.EATING)
        }
    }
    onWattingPartnerExit() {

    }
    //吃饭中，会偶尔发出表情，吃一个汉堡，打赏一下
    onEattingEnter() {
        this.seatInfo.desk.play()
        this.emojiTimeCount = 0
    }
    emojiTimeCount: number = 0
    onEattingUpdate(dt: number) {
        if (this.seatInfo.desk.checkFinished()) {
            if (Global.game.map.getOpenDeskCount() >= 3 && Math.random() < 0.03)
                this.fsm.changeState(CUSTOMER_ACTION.SLEEPING)
            else
                this.fsm.changeState(CUSTOMER_ACTION.LEAVING)
        } else {
            this.emojiTimeCount += dt
            if (this.emojiTimeCount >= 4) {
                this.emojiTimeCount = 0
                this.headTip.changeState(HEAD_TIP_STATE.HAPPY)
            }
        }

    }
    onEattingExit() {

    }

    //吃完了，离开
    onLeavingEnter() {
        Global.game.removeCustomerFromEatting(this)

        let mat = this.GetGameObject('main_Character').getComponent(MeshRenderer).material
        mat.setProperty('albedo', v4(0.02, 0.25, 0.215, 1))



        this.node.emit(GameConst.EventType.RemoveSleepState)
        this.seatInfo.desk.customStandUp(this.seatInfo.index)
        //计算要移动到的位置todo
        let endNode = find('stage01_cocos/CustomerPath/PathExit', this.delegate.sceneNode)
        let endPos = v3()
        Vec3.subtract(endPos, endNode.worldPosition, v3(0, 0, this.queueIndex * 1.5))
        let path = this.delegate.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {
            this.goto(path, () => {
                this.node.emit(GameConst.EventType.Remove, this)
            })
        } else {
            warn('customer path error')
        }
    }
    onLeavingUpdate(dt: number) {

    }
    onLeavingExit() {

    }
    //捣乱的顾客，打电话
    phoneTime: number = 0;
    arrow: Node
    onPhoneEnter() {
        this.phoneQueueIndex = this.queueIndex
        this.phoneTime = 0



        //箭头
        this.createArrow()

        Global.camera.addLookAtNode(this.node, null, 0.8)

    }
    async createArrow() {
        let item = await AssetPool.Instance().createObjAsync('ui/GuideArrow', 'GuideArrow');
        item.parent = this.node;
        item.position = v3(0, 2, 0);
        let comp = item.getComponent(GuideArrow)
        comp.setRed()
        this.arrow = item

    }
    onPhoneUpdate(dt: number) {
        this.phoneTime += dt
        if (this.phoneTime >= 60) {
            this.phoneTime = 0
            this.onPhoneFinish()
        }
    }

    onPhoneFinish() {
        this.type = GameConst.CUSTOME_TYPE.Normal
        this.fsm.changeState(CUSTOMER_ACTION.WAITTING_IN_QUEUE)
        if (this.arrow) {
            AssetPool.Instance().put(this.arrow)
            this.arrow = null
        }
        Global.game.resetCustomerQueue()
    }


    onPhoneExit() {

    }
    sleepTime: number = 0;
    onSleepingEnter() {
        this.sleepTime = 0
        let mat = this.GetGameObject('main_Character').getComponent(MeshRenderer).material
        mat.setProperty('albedo', v4(1, 0, 0, 1))
        this.createSleepState()

        Global.camera.addLookAtNode(this.node, null, 0.8)
    }

    onSleepingUpdate(dt: number) {
        this.sleepTime += dt
        if (this.sleepTime >= 60) {
            this.sleepTime = 0
            this.fsm.changeState(CUSTOMER_ACTION.LEAVING)
        }
    }
    createSleepState() {
        return new Promise(async (resolve, reject) => {
            let infoNode: Node = await AssetPool.Instance().createObjAsync('stageui/SleepEffect', 'SleepEffect');
            infoNode.parent = Global.game.node_container
            infoNode.setWorldPosition(this.node.worldPosition.clone().add(v3(0, 2, 0)))
            let eff = infoNode.getComponent(SleepEffect)
            eff.target = this.node
        })

    }
    forceToLeave() {
        this.fsm.changeState(CUSTOMER_ACTION.LEAVING)
    }

    onDisable() {
        if (this.arrow) {
            AssetPool.Instance().put(this.arrow)
            this.arrow = null
        }
    }

    update(dt) {
        this.triggerCheck()
        this.updateAni()
    }
    //只和大门碰撞
    triggerCheck() {
        //检测是否进入解锁区域
        if (!Global.game || !Global.game.map) return
        let item = Global.game.map.getMapItemById(FacilityID.Gate)

        if (!item) return
        let triggerList = item.triggerAreaList;
        if (!triggerList) return
        for (const trigger of triggerList) {
            //  let can = item.checkCond(trigger.type);
            if (trigger.pos) {
                let key = `__player_in_${trigger.type}_${this.key}`
                let dis = this.node.worldPosition.clone().subtract(trigger.pos).length()
                if (dis < trigger.dis) {
                    if (item[key]) {
                        item.onTriggerStay(this, trigger.type)
                    } else {
                        item.onTriggerEnter(this, trigger.type)
                    }
                    item[key] = true;
                } else {
                    if (item[key]) {
                        item.onTriggerExit(this, trigger.type)
                    }
                    item[key] = false;
                }
            }
        }

    }


    public get type(): number {
        return this._type;
    }
    public set type(value: number) {
        this._type = value;
        let mat = this.GetGameObject('main_Character').getComponent(MeshRenderer).material
        if (value == GameConst.CUSTOME_TYPE.Boss) {
            mat.setProperty('albedo', v4(0.8, 0.8, 0, 1))
            this.GetGameObject('Stage01_Skin_2').active = true;
        } else if (value == GameConst.CUSTOME_TYPE.Normal) {
            mat.setProperty('albedo', v4(0.02, 0.25, 0.215, 1))
            let rnd = Math.random()
            if (rnd < 0.2)
                this.GetGameObject('Stage01_Skin_1').active = true
            else if (rnd < 0.3)
                this.GetGameObject('Stage01_Skin').active = true
        } else if (value == GameConst.CUSTOME_TYPE.Calling) {

            mat.setProperty('albedo', v4(1, 0, 0, 1))

        }
    }

    //外部接口
    goto(path: Vec3[], callback: Function = null) {
      
        this.moveEngine.speed = 2.5
        this.moveEngine.goto(path,callback)
        this.moveEngine.running = true
    }
    //动画流程的播放
    updateAni() {
        if (this.moveEngine.running) {
            if (this.stackList.length == 0)
                this.playAni('Customer walk')
            else
                this.playAni('Customer carry_walk')
        }
        else {
            if (this.fsm.isInState(CUSTOMER_ACTION.WAITTING_PARTNER) || this.fsm.isInState(CUSTOMER_ACTION.EATING)) {
                if (this.seatInfo.desk.isWindow)
                    this.playAni('Customer_Sit_window_Idle')
                else
                    this.playAni('Customer_Sit_Idle')
            } else if (this.fsm.isInState(CUSTOMER_ACTION.PHONE)) {
                this.playAni('Customer_Idle_phone')
            } else if (this.fsm.isInState(CUSTOMER_ACTION.SLEEPING)) {
                this.playAni('Customer_Sit_sleep')
            } else if (this.fsm.isInState(CUSTOMER_ACTION.ANGRY)) {
                this.playAni('Customer_angry')
            } else {
                if (this.stackList.length > 0)
                    this.playAni('Customer_Stack_Idle')
                else
                    this.playAni('Customer_Idle')
            }

        }
    }
    private curAni: string = ''
    playAni(aniName) {
        if (this.curAni != aniName) {
            this.ani.play(aniName)
            this.curAni = aniName
        }

    }
    shiftInQueue(index: number) {
        //当前面顾客离开的时候需要前移
        //计算路径

        this.queueIndex = index
        this.fsm.changeState(CUSTOMER_ACTION.GOTO_ORDER_STATION, true)//强制切换状态
    }

    addFood(item: any) {
        if (!this.fsm.isInState(CUSTOMER_ACTION.ORDING)) {
            warn('顾客不是点餐状态，错误')
            return
        }
        if (this.needFoodInfo == null) {
            warn('没有食物需求')
        } else {
            this.ownFood++

            // item.parent = this.foodNode
            // item.position = v3(0, (this.ownFood - 1) * 0.5)
            let targetPos = v3(0, (this.ownFood - 1) * 0.5)


            Global.game.flyTo(item, this.foodNode, this.foodNode.worldPosition.clone().add(targetPos.clone()), 0.25, () => {
                item.position = targetPos
            })
            this.stackList.push(item)

            this.node.emit(GameConst.EventType.UpdateHeadTip, { type: this.needFoodInfo.type, count: this.needFoodInfo.count - this.ownFood })
            if (this.ownFood >= this.needFoodInfo.count) {
                this.fsm.changeState(CUSTOMER_ACTION.CHECK_SEAT)
                this.headTip.changeState(HEAD_TIP_STATE.IDLE)
            }
        }
    }
    getAction() {
        return this.fsm.getCurrState().id
    }
    isCalling() {
        return this.fsm.isInState(CUSTOMER_ACTION.PHONE)
    }
    isSleeping() {
        return this.fsm.isInState(CUSTOMER_ACTION.SLEEPING)
    }
    canAdd(type: number = ItemType.Burger) {
        if (this.fsm.isInState(CUSTOMER_ACTION.PHONE)) return false
        return true
    }



}


