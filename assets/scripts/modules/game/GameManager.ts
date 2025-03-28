import { _decorator, Component, Node, Vec3, v3, find, director, tween, Camera, bezier, Prefab, SkelAnimDataHub, widgetManager } from 'cc';
import GameConst, { BOOST_DESTORY_TIME, BOOST_TIME, BOOST_TYPE, FacilityID, ItemType } from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import Model from '../../data/Model';
import GameData from '../../GameData';
import { MapManager } from '../map/MapManager';
import { Customer, CUSTOMER_ACTION } from './Customer';
import { FollowCamera } from './FollowCamera';
import { Player } from './Player';
import WindowManager from '../../manager/WindowManager';
import { PackageStaff } from './Staff/PackageStaff';
import { PackageTable } from './mapitems/PackageTable';
import { CashierDesk } from './mapitems/CashierDesk';
import { CashierStaff } from './Staff/CashierStaff';
import { DriveCarTable } from './mapitems/DriveCarTable';
import { DriveCarStaff } from './Staff/DriveCarStaff';
import { Car } from './Car';
import { BoostItem } from './mapitems/BoostItem';
import Utils from '../../utils/Utils';
import { EventManager, EventType } from '../../event/EventManager';
import { NormalStaff } from './Staff/NormalStaff';
import { BaseStaff } from './Staff/BaseStaff';
import { DeliveryDriver } from './DeliveryDriver';
import GuideManager from '../guide/GuideManager';
import BaseComponent from '../../component/Component';
import { InitMoneyArea } from './mapitems/InitMoneyArea';
import { CountDownUI } from '../ui/CountDownUI';
import { LoadingWin } from '../ui/LoadingWin';
import { AudioMgr } from '../../utils/AudioMgr';
import ResHelper from '../../utils/ResHelper';
const { ccclass, property } = _decorator;




@ccclass('GameManager')
export class GameManager extends BaseComponent {
    @property(Node)
    node_container: Node = null;

    @property(Node)
    uiNode: Node = null;

    @property(FollowCamera)
    camera: FollowCamera = null

    sceneNode: Node = null;
    map: MapManager = null;

    queueCustomers: Customer[]
    eattingCustomer: Customer[]
    queueCars: Car[];
    customerID: number = 0

    deliveryDriver: DeliveryDriver = null;

    staffs: BaseStaff[] = []

    createTimer: number = 0;
    createInterval: number = 2.5;

    createCarTimer: number = 0;
    createCarInterval: number = 3;

    createDeliveryDriverTimer: number = 0;
    createDeliveryDriverInterval: number = 300;      

    start() {
        this.reset()

        this.loadConfigs()
        AudioMgr.Instance().init()
        AudioMgr.Instance().playBGM('Athens_Street_Cafe_Ambience')

        let wx = window['wx'];
        if (wx) {
            this.checkUpdata()
            wx.onShow(this.onGameShow.bind(this));
            wx.onHide(this.onGameHide.bind(this));
        }

        EventManager.Inst.on(EventType.NotEnoughMoney, this, this._createMoneyItem);
    }

    checkUpdata() {
        try {
            if (window["wx"]) {
                if ("function" == typeof window["wx"].getUpdateManager) {
                    const t = window["wx"].getUpdateManager();
                    t.onCheckForUpdate(function (t) {
                    }), t.onUpdateReady(() => {
                        window["wx"].showModal({
                            title: "更新提示",
                            content: "有新版本啦！，赶快开启新的历程吧~",
                            success: function (res) {
                                if (res.confirm) {
                                    t.applyUpdate();
                                } else {
                                    window["wx"].showToast({
                                        icon: "none",
                                        title: "下一次启动时会使用新版本",
                                    });
                                }
                            },
                        });
                    }), t.onUpdateFailed(function () {
                    });
                }
            }
        } catch (e) {
        }
    }



    private onGameShow(param: any) {
        director.resume()
    }


    private onGameHide() {
        director.pause();
    }



    reset() {
        this.queueCustomers = []
        this.queueCars = []
        this.eattingCustomer = []

        Global.camera = this.camera
        Global.game = this
        WindowManager.Instance().register(this.uiNode.getChildByName("ui_container"))
        WindowManager.Instance().open(GameConst.winPath.GameWin);
    }

    loadConfigs() {
        Model.loadData()
        GameData.init(() => {
            console.log("配置加载完毕")

            this.createGame()
        })
    }

    update(dt: number) {
        this.checkCreateCustom(dt);
        this.checkCreateCar(dt);
        this.checkCreateDeliveryDriver(dt);
        this.checkBoost(dt);
    }
    checkCreateCustom(dt: number) {
        if (!this.map) return;
        if (!Global.player) return;
        if (GuideManager.Instance().currentGuideId < 8) return

        this.createTimer += dt;
        if (this.createTimer >= this.createInterval && this.queueCustomers.length < GameConst.MAX_CUSTOMER) {
            let startNode = find('stage01_cocos/CustomerPath/PathStart_1', this.sceneNode)
            let pos = startNode.worldPosition.clone()
            if (this.queueCustomers.length < 3 && GuideManager.Instance().currentGuideId <= 9) {
                pos = v3(4, 0, 0)
            }
            let deskCount = this.map.getOpenDeskCount()
            let type = GameConst.CUSTOME_TYPE.Normal
            if (deskCount > 4 && Math.random() < 0.02)
                type = GameConst.CUSTOME_TYPE.Calling
            else if (deskCount >= 2 && Math.random() < 0.05)
                type = GameConst.CUSTOME_TYPE.Boss





            this.createCustomer(type, pos);
            this.createTimer = 0;
        }
    }
    checkCreateCar(dt: number) {

        if (GuideManager.Instance().currentGuideId < 18) return

        this.createCarTimer += dt;
        if (this.createCarTimer >= this.createCarInterval && this.queueCars.length < GameConst.MAX_CAR) {
            let startNode = find('stage01_cocos/DrivePath/PathStart', this.sceneNode);
            if (!startNode) {

                return;
            }
            let deskCount = this.map.getOpenDeskCount()
            let type = GameConst.CAR_TYPE.Normal

            if (deskCount >= 2 && Math.random() < 0.05)
                type = GameConst.CAR_TYPE.Supercar
            this.createCar(type, startNode.position.clone());
            this.createCarTimer = 0;
        }
    }

    checkCreateDeliveryDriver(dt: number) {
        if (!this.map) return;
        if (Global.game.map.getOpenDeskCount() < 5) return;

        this.createDeliveryDriverTimer += dt;
        if (this.createDeliveryDriverTimer >= this.createDeliveryDriverInterval && !this.deliveryDriver) {
            let startNode = find('stage01_cocos/DeliveryCustomerPath/PathStart_2', this.sceneNode)
            if (!startNode) {

                return;
            }
            this.createDeliveryDriver(0, startNode.position.clone());
            this.createDeliveryDriverTimer = 0;
        }
    }

    async createGame() {
        await this.loadRes()
        await this.createScene()

        let pos = v3(0,0,1)
        if (GuideManager.Instance().currentGuideId <= 2)
            pos = this.map.GetGameObject('PlayerBorn').worldPosition
        await this.createPlayer(pos)

        GuideManager.Instance().startGuide()

        let loadingui = director.getScene().getComponentInChildren(LoadingWin)
        loadingui.node.destroy();
    }
    loadRes() {

        return new Promise(async (resolve, reject) => {
            let burger: any = await ResHelper.loadResSync('entity/Burger', 'prefabs', Prefab)
            AssetPool.Instance().addPrefab(burger, 'Burger');

            let curtomer: any = await ResHelper.loadResSync('entity/Customer', 'prefabs', Prefab)
            AssetPool.Instance().addPrefab(curtomer, 'Customer');

            resolve(null)
        })
    }
    createScene() {
        return new Promise(async (resolve, reject) => {
            let sceneNode: Node = await AssetPool.Instance().createObjAsync('stage/stage01_cocos', 'Stage01');
            sceneNode.parent = this.node_container
            this.sceneNode = sceneNode;
            this.map = sceneNode.getComponent(MapManager) || sceneNode.addComponent(MapManager)
            resolve(null)
        })
    }
    createPlayer(bornPos: Vec3) {
        return new Promise(async (resolve, reject) => {
            let playerNode: Node = await AssetPool.Instance().createObjAsync('entity/Player', 'Player');
            playerNode.parent = this.node_container
            let playerComp = playerNode.getComponent(Player)
            playerComp.key = 'player'
            playerNode.position = bornPos
            console.log('playerPos', playerNode.position)
            this.camera.target = playerNode
            resolve(null)
        })

    }
    createCustomer(type: number, bornPos: Vec3) {
        return new Promise(async (resolve, reject) => {
            let customerNode: Node = await AssetPool.Instance().createObjAsync('entity/Customer', 'Customer');
            customerNode.parent = this.node_container
            let customerComp = customerNode.getComponent(Customer)
            customerNode.position = bornPos
            customerComp.type = type
            customerComp.delegate = this
            if (this.queueCustomers.length == 0)
                customerComp.run(0)
            else
                customerComp.run(this.queueCustomers[this.queueCustomers.length - 1].queueIndex + 1)
            this.queueCustomers.push(customerComp)

            customerNode.on(GameConst.EventType.Remove, this.onCustomerRemoved, this)
            this.customerID++
            customerComp.key = 'customer' + this.customerID
            resolve(null)
        })

    }
    createCar(type: number, bornPos: Vec3) {
        return new Promise(async (resolve, reject) => {
            let carNode: Node = await AssetPool.Instance().createObjAsync('entity/Car', 'Car');
            carNode.parent = this.node_container
            let carComp = carNode.getComponent(Car)
            carNode.position = bornPos
            carComp.type = type
            carComp.run(this.queueCars.length)
            this.queueCars.push(carComp)
            carNode.on(GameConst.EventType.Remove, this.onCarRemoved, this)
            resolve(null)
        })
    }


    createDeliveryDriver(type: number, bornPos: Vec3) {
        return new Promise(async (resolve, reject) => {
            let node: Node = await AssetPool.Instance().createObjAsync('entity/DeliveryDriver', 'DeliveryDriver');
            node.parent = this.node_container
            let deliverdriverComp = node.getComponent(DeliveryDriver)
            node.position = bornPos
            deliverdriverComp.type = type
            deliverdriverComp.run()
            this.deliveryDriver = deliverdriverComp;
            node.on(GameConst.EventType.Remove, this.onDeliveryDriverRemoved, this)
            resolve(null)
        })
    }


    createPackageStaff(container: Node, pos: Vec3, table: PackageTable) {
        return new Promise(async (resolve, reject) => {
            let node: Node = await AssetPool.Instance().createObjAsync('entity/PackageStaff', 'PackageStaff');
            node.parent = container
            node.position = pos
            node.getComponent(PackageStaff).table = table
            resolve(null)
        })
    }

    createCashierStaff(container: Node, pos: Vec3, table: CashierDesk) {
        return new Promise(async (resolve, reject) => {
            let node: Node = await AssetPool.Instance().createObjAsync('entity/CashierStaff', 'CashierStaff');
            node.parent = container
            node.position = pos
            node.getComponent(CashierStaff).table = table
            resolve(null)
        })
    }
    createDriveCarStaff(container: Node, pos: Vec3, table: DriveCarTable) {
        return new Promise(async (resolve, reject) => {
            let node: Node = await AssetPool.Instance().createObjAsync('entity/DriveCarStaff', 'DriveCarStaff');
            node.parent = container
            node.position = pos
            node.getComponent(DriveCarStaff).table = table
            resolve(null)
        })
    }

    createNormalStaff(pos: Vec3, index: number) {
        console.log('创建普通员工');
        return new Promise(async (resolve, reject) => {
            let node: Node = await AssetPool.Instance().createObjAsync('entity/NormalStaff', 'NormalStaff');
            node.parent = this.node_container
            node.position = pos
            let comp = node.getComponent(NormalStaff)
            comp.key = 'normalStaff' + this.staffs.length
            comp.index = index
            this.staffs.push(comp)
            resolve(null)
        })

    }
    onCustomerRemoved(customer: Customer) {
        AssetPool.Instance().put(customer.node)
    }
    onCarRemoved(car: Car) {
        for (let i = 0; i < this.queueCars.length; i++) {
            if (this.queueCars[i] == car) {
                this.queueCars.splice(i, 1)
                break
            }
        }
        for (let i = 0; i < this.queueCars.length; i++) {
            this.queueCars[i].shiftInQueue(i)
        }
    }

    onDeliveryDriverRemoved(driver: DeliveryDriver) {
        this.deliveryDriver = null;
        AssetPool.Instance().put(driver.node)
    }

    removeCustomerFormQueue(customer: Customer) {
        for (let i = 0; i < this.queueCustomers.length; i++) {
            if (this.queueCustomers[i] == customer) {
                this.queueCustomers.splice(i, 1)
                break
            }
        }


        this.resetCustomerQueue()
    }
    removeCustomerFromEatting(customer: Customer) {
        for (let i = 0; i < this.eattingCustomer.length; i++) {
            if (this.eattingCustomer[i] == customer) {
                this.eattingCustomer.splice(i, 1)
                break
            }
        }

    }
    resetCustomerQueue() {
        let index = this.getCallingCustomerIndex()

        for (let i = 0; i < this.queueCustomers.length; i++) {
            let customer = this.queueCustomers[i]
            if (customer.queueIndex < index || index == -1) {
                this.queueCustomers[i].shiftInQueue(i)
            }
        }
    }

    getCallingCustomerIndex() {
        let customer = this.queueCustomers.find(c => c.isCalling())
        if (customer)
            return customer.phoneQueueIndex
        return -1
    }
    getCallingCustomer() {
        let allCalling = []
        for (const temp of this.queueCustomers) {
            let v = v3()
            Vec3.subtract(v, temp.node.worldPosition, Global.player.node.worldPosition)
            if (temp.isCalling() && v.length() < 1)
                allCalling.push(temp)
        }
        if (allCalling.length > 0) {
            let e = allCalling[0]
            let v = v3()
            Vec3.subtract(v, Global.player.node.worldPosition, e.node.worldPosition)
            let dis = v.length()
            for (let i = 1; i < allCalling.length; i++) {
                let v2 = v3()
                Vec3.subtract(v2, Global.player.node.worldPosition, allCalling[i].node.worldPosition)
                if (v2.length() < dis) {
                    dis = v2.length()
                    e = allCalling[i]
                }
            }
            return e
        }
        return null


    }
    getSleepCustomer() {
        let allSleep = []
        for (const temp of this.eattingCustomer) {
            let v = v3()
            Vec3.subtract(v, temp.node.worldPosition, Global.player.node.worldPosition)
            if (temp.isSleeping() && v.length() < 1)
                allSleep.push(temp)
        }
        if (allSleep.length > 0) {
            let e = allSleep[0]
            let v = v3()
            Vec3.subtract(v, Global.player.node.worldPosition, e.node.worldPosition)
            let dis = v.length()
            for (let i = 1; i < allSleep.length; i++) {
                let v2 = v3()
                Vec3.subtract(v2, Global.player.node.worldPosition, allSleep[i].node.worldPosition)
                if (v2.length() < dis) {
                    dis = v2.length()
                    e = allSleep[i]
                }
            }
            return e
        }
        return null
    }

    checkConditions(conditions: number[]) {
        let bol = false
        for (const cType of conditions) {
            if (cType == GameConst.CONDITION_TYPE.CAN_CASHIER) {
                return true
            } else if (cType == GameConst.CONDITION_TYPE.CAN_DRIVE_CAR) {
                let facility = this.map.getMapItemById(FacilityID.PackageTable)
                if (facility && facility.unlock) {
                    return (facility as PackageTable).hasPackageBox()
                }
            } else if (cType == GameConst.CONDITION_TYPE.CAN_PACKAGE) {
                let facility = this.map.getMapItemById(FacilityID.PackageTable)
                return facility.unlock
            } else if (cType == GameConst.CONDITION_TYPE.HAS_LITTER) {
                return this.map.getSeatWithLitter() != null
            }
        }
        return bol
    }

    getFirstQueueCustomer() {
        for (const customer of this.queueCustomers) {
            if (customer.getAction() == CUSTOMER_ACTION.ORDING) {
                return customer
            }
        }
        return null
    }

    getFirstQueueCar() {
        for (const car of this.queueCars) {
            if (car.isOrding()) {
                return car
            }
        }
        return null
    }



    private lastBoostTime: number = 0;
    checkBoost(dt: number) {
        if (Model.game.guideID < 12) return;
        if (Date.now() - this.lastBoostTime < 90 * 1000) return;
        this.lastBoostTime = Date.now();
        this._createBoostItem();
    }

    private async _createBoostItem() {
        if (!this.map) return;
        if (!Global.player) return;
        let parent = this.map.getEmptyBoostNode();
        if (!parent) return;

        let hasSkate = Model.game.hasSkate();
        let hasGloves = Model.game.hasGloves();
        let hasPinghengche = Model.game.hasPingHengChe();



        parent.getComponentsInChildren(BoostItem).forEach(a => {
            if (a.type == BOOST_TYPE.BOOST_INLINESKATE_BLUE || a.type == BOOST_TYPE.BOOST_INLINESKATE_PINK) {
                hasSkate = true;
            }
            if (a.type == BOOST_TYPE.BOOST_GLOVES) {
                hasGloves = true;
            }
        })


        if (hasSkate && hasGloves) return;
        let item = await AssetPool.Instance().createObjAsync('entity/BoostItem', 'BoostItem');
        item.parent = parent;
        item.position = v3(0, 0, 0);

        let boostItem = item.getComponent(BoostItem);
        if (hasGloves) {
            boostItem.setType(Utils.randomItem([BOOST_TYPE.BOOST_INLINESKATE_BLUE, BOOST_TYPE.BOOST_INLINESKATE_PINK]));
        } else if (!hasPinghengche) {
            boostItem.setType(BOOST_TYPE.BOOST_GLOVES);
        }
    }


    private _lastcreateMoneyBoostTime: number = 0;
    private async _createMoneyItem() {
        if (!this.map) return;
        if (!Global.player) return;
        if (Date.now() - this._lastcreateMoneyBoostTime < 120 * 1000) return;
        this._lastcreateMoneyBoostTime = Date.now();
        let parent = this.map.getEmptyBoostNode();
        if (!parent) return;

        let item = await AssetPool.Instance().createObjAsync('entity/BoostItem', 'BoostItem');
        item.parent = parent;
        item.position = v3(0, 0, 0);

        let boostItem = item.getComponent(BoostItem);
        boostItem.setType(BOOST_TYPE.MONEY);
    }

    createInitMoney() {
        let moneyArea = this.map.GetGameObject('StageObjects').getChildByName('MoneyArea');
        moneyArea.getComponent(InitMoneyArea).createInitMoney()
    }



    focusToDoor() {
        console.log('do ani -----------------------')
        Global.player.pauseMove = true;
        let cameraDoorNode = this.GetGameObject("cameraDoorAniPos", this.node.parent, true)

        Global.player.node.setRotationFromEuler(v3(0, 180, 0));
        let PlayerBorn = this.map.GetGameObject('PlayerBorn')
        this.camera.addLookAtNode(PlayerBorn, cameraDoorNode, 2, () => {
            setTimeout(() => {
                Global.player.pauseMove = false;
                GuideManager.Instance().onEventTrigger('onAniPlayComplete')

                WindowManager.Instance().open(GameConst.winPath.BoostWin, { type: BOOST_TYPE.PINGHENGCHE, node: null });

            }, 1000);
        })

    }

    async playMoneyAni(startPos: Vec3, endPos: Vec3, count: number = 8) {
        for (let i = 0; i < count; i++) {
            let item = await AssetPool.Instance().createObjAsync('entity/Money', 'Money');
            item.worldPosition = startPos
            item.parent = this.node
            item.active = false


            let controlPos = v3()
            Vec3.add(controlPos, startPos, endPos).clone()
            Vec3.multiplyScalar(controlPos, controlPos, 0.5)
            controlPos.add(v3(0, 5, 0))

            tween(item).delay(i * 0.05).call(() => {
                item.active = true
                Utils.bezierTo(item, 0.15, startPos, controlPos, endPos).call(() => {
                    AssetPool.Instance().put(item)
                }).start()
            }).start()

        }
    }
    isCountDown = false
    countDownUI: Node = null
    async createCountDownUI(customer: Customer) {
        if (this.isCountDown) return
        this.isCountDown = true
        let ui: Node = await AssetPool.Instance().createObjAsync('ui/CountDownUI', 'CountDownUI');
        ui.parent = this.uiNode
        if (this.countDownUI) {
            this.countDownUI.getComponent(CountDownUI).stop()
            AssetPool.Instance().put(this.countDownUI)
        }
        this.countDownUI = ui
        let v3_0 = v3()
        customer.node.getWorldPosition(v3_0);
        ui.getComponent(CountDownUI).play(() => {
            if (customer.isCalling()) {
                Global.game.removeCustomerFormQueue(customer)
                AssetPool.Instance().put(customer.node)
            }
            else if (customer.isSleeping) {
                customer.forceToLeave()
            }

            this.removeCountDownUI()
        })
        Global.camera.node.getComponentInChildren(Camera).convertToUINode(v3_0, this.uiNode, v3_0);
        ui.setPosition(v3_0.add(v3(0, 100)))

        if (!this.isCountDown) {
            this.removeCountDownUI()
        }
    }
    removeCountDownUI() {
        if (this.countDownUI) {
            this.countDownUI.getComponent(CountDownUI).stop()
            AssetPool.Instance().put(this.countDownUI)
        }
        this.countDownUI = null
        this.isCountDown = false
    }

    flyTo(item: Node, parent: Node, targetPos: Vec3, t: number = 0.25, callback: Function = null) {
        let oldPos = item.worldPosition.clone();
        let oldRotation = item.worldRotation.clone()

        item.parent = parent;
        let newAngle = item.eulerAngles.clone()

        item.worldPosition = oldPos;
        item.worldRotation = oldRotation;

        let startPos = oldPos;
        let controlPos = v3()
        let des = targetPos
        Vec3.add(controlPos, startPos, des)
        Vec3.multiplyScalar(controlPos, controlPos, 0.5)
        controlPos.add(v3(0, 5, 0))

        tween(item).to(t, { eulerAngles: newAngle }).start()
        Utils.bezierTo(item, t, startPos, controlPos, des).call(() => {
            callback && callback()
        }).start()




    }
}


