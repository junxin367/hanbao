import { _decorator, Component, Node, error, Vec3, log, find, v3, Color } from 'cc';
import GameConst, { FacilityID, ItemType } from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import Model from '../../../data/Model';
import FSM, { FSMAction } from '../../../utils/FSM';
import { Desk } from '../mapitems/Desk';
import { Item } from '../mapitems/Item';
import { PackageTable } from '../mapitems/PackageTable';
import { PropMaker } from '../mapitems/PropMaker';
import { MovePath } from '../MovePath';
import { SleepEffect } from '../SleepEffect';
import { BaseStaff, STAFF_ACTION } from './BaseStaff';
const { ccclass, property } = _decorator;

interface WorkerAction {
    actionType: number;
    prob: number; 
    conditions: number[]; 
}








enum NORMAL_STAFF_ACTION {
    CHECK = 0,
    CARRY_TO_CASIER_COUNTER = 1,
    CARRY_TO_PACKAGE_COUNTER,
    CARRY_TO_DRIVECAR_COUNTER,
    CLEAN_LITTER,
    IDLE,
    SLEEP,
    GOTO_RESET,
}



@ccclass('NormalStaff')
export class NormalStaff extends BaseStaff {

    workerAction: WorkerAction
    actionList: WorkerAction[]
    moveEngine: MovePath


    initFsm() {
        this.fsm = this.node.addComponent(FSM)
        this.fsm.init(this)
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.CARRY_TO_CASIER_COUNTER, this.onGotoCashierEnter, this.onGotoCashierUpdate))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.CARRY_TO_PACKAGE_COUNTER, this.onGoPackageEnter, this.onGoPackageUpdate))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.CARRY_TO_DRIVECAR_COUNTER, this.onGotoDriveCarEnter, this.onGotoDriveCarUpdate))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.CLEAN_LITTER, this.onCleanLitterEnter, this.onCleanLitterUpdate))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.IDLE, this.onIdleEnter, this.onIdleUpdate, this.onIdleExit))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.SLEEP, this.onRestingEnter, this.onRestingUpdate, this.onRestingExit))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.CHECK, this.onCheckEnter, this.onCheckUpdate))
        this.fsm.addState(new FSMAction(this, NORMAL_STAFF_ACTION.GOTO_RESET, this.onGotoRestEnter, this.onGotoRestUpdate))

    }

    start() {
        this.moveEngine = this.node.addComponent(MovePath)





        this.initAction()

        this.fsm.changeState(NORMAL_STAFF_ACTION.CHECK)
    }

    onGotoCashierEnter() {
        let machine1 = Global.game.map.getMapItemById(FacilityID.Burger_Machine1) as PropMaker
        let machine2 = Global.game.map.getMapItemById(FacilityID.Burger_Machine2) as PropMaker
        let rnd = Math.floor(Math.random() * 2 + 2)
        if (machine1.stackList.length > rnd || machine2.stackList.length > rnd) {
            let endNode = machine1.GetGameObject('Coffee')
            if (machine2.unlock && Math.random() < 0.5) {
                endNode = machine2.GetGameObject('Coffee')
            }
            let path = Global.game.map.findPath(this.node.worldPosition, endNode.worldPosition.clone());
            if (path.length > 0) {
                this.goto(path, () => {

                })
            } else {
                error('--------')
                this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
            }
        }
        else
            this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
    };
    onGotoCashierUpdate() {

    };

    onGoPackageEnter() {
        let facility = Global.game.map.getMapItemById(FacilityID.PackageTable) as PackageTable
        if (facility.unlock && facility.stackList.length < 20) {

            let machine1 = Global.game.map.getMapItemById(FacilityID.Burger_Machine1) as PropMaker
            let machine2 = Global.game.map.getMapItemById(FacilityID.Burger_Machine2) as PropMaker
            let rnd = Math.floor(Math.random() * 2 + 2)
            if (machine1.stackList.length > rnd || machine2.stackList.length > rnd) {
                let endNode = machine1.GetGameObject('Coffee')
                if (machine2.unlock && Math.random() < 0.3) {
                    endNode = machine2.GetGameObject('Coffee')
                }
                let path = Global.game.map.findPath(this.node.worldPosition, endNode.worldPosition.clone());
                if (path.length > 0) {
                    this.goto(path, () => {

                    })
                } else {
                    error('--------')
                    this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
                }
            } else {
                this.checkNextAction()
            }
        }
        else
            this.checkNextAction()
    };
    onGoPackageUpdate(dt: number) {

    };

    onGotoDriveCarEnter() {

        let facility = Global.game.map.getMapItemById(FacilityID.PackageTable)
        let endPos = v3()
        Vec3.subtract(endPos, facility.triggerAreaList[3].pos, v3(-0.5, 0, 0))
        let path = Global.game.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {
            this.goto(path, () => {

            })
        } else {
            error('--------')
            this.checkNextAction()
        }
        this.aidTime = 0
    };
    onGotoDriveCarUpdate(dt: number) {
        this.aidTime += dt;
        if (this.aidTime > 1) {
            this.aidTime = 0
            let facility = Global.game.map.getMapItemById(FacilityID.PackageTable)
            if (facility && facility.unlock) {
                if (!(facility as PackageTable).hasPackageBox()) {
                    if (this.stackList.length > 0 && this.stackList[0].getComponent(Item).type == ItemType.Package) return
                    this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
                }
            }
        }
    };

    curDesk: Desk = null
    onCleanLitterEnter() {
        this.curDesk = null
        let desk = Global.game.map.getSeatWithLitter()
        if (desk) {
            let path = Global.game.map.findPath(this.node.worldPosition.clone(), desk.node.worldPosition.clone());
            if (path.length > 0) {
                this.curDesk = desk
                this.goto(path, () => {

                })
            } else {
                console.error('cleanGarbage path error')
                this.checkNextAction()
            }
        } else {
            this.checkNextAction()
        }
        this.aidTime = 0
    };
    onCleanLitterUpdate(dt: number) {
        this.aidTime += dt;
        if (this.aidTime > 1) {
            if (!this.curDesk || !this.curDesk.hasLitter) {
                if (this.stackList.length > 0 && this.stackList[0].getComponent(Item).type == ItemType.Litter) return
                this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
            }
            this.aidTime = 0
        }
    };

    onCheckEnter() { }
    onCheckUpdate(dt: number) {
        if (Global.game.map.buildComplete())
            this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
    }
    onIdleEnter() {

        this.aidTime = 0
        this.aidDelay = Math.random() + 0.5
    }
    aidTime = 0
    aidDelay = 0
    onIdleUpdate(dt: number) {
        this.aidTime += dt
        if (this.aidTime > this.aidDelay) {
            this.aidTime = 0
            this.checkNextAction()
        }
    }
    onIdleExit() {

    }

    initAction() {
        this.actionList = [
            { actionType: NORMAL_STAFF_ACTION.CARRY_TO_DRIVECAR_COUNTER, prob: 20, conditions: [GameConst.CONDITION_TYPE.CAN_DRIVE_CAR] },
            { actionType: NORMAL_STAFF_ACTION.CARRY_TO_PACKAGE_COUNTER, prob: 20, conditions: [GameConst.CONDITION_TYPE.CAN_PACKAGE] },
            { actionType: NORMAL_STAFF_ACTION.CARRY_TO_CASIER_COUNTER, prob: 35, conditions: [GameConst.CONDITION_TYPE.CAN_CASHIER] },
            { actionType: NORMAL_STAFF_ACTION.CLEAN_LITTER, prob: 15, conditions: [GameConst.CONDITION_TYPE.HAS_LITTER] },
            { actionType: NORMAL_STAFF_ACTION.IDLE, prob: 5, conditions: [GameConst.CONDITION_TYPE.CAN_CASHIER] },
            { actionType: NORMAL_STAFF_ACTION.GOTO_RESET, prob: 5, conditions: [GameConst.CONDITION_TYPE.CAN_CASHIER] },
        ]


    }

    getRandomAction(actions: WorkerAction[]) {
        const totalProbability = actions.reduce((sum, action) => sum + action.prob, 0);
        const random = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        for (const action of actions) {
            if (!Global.game.checkConditions(action.conditions)) continue
            cumulativeProbability += action.prob;
            if (random < cumulativeProbability) {
                return action;
            }
        }
        return null;
    }

    checkNextAction() {
        this.moveEngine.running = false
        let act = this.getRandomAction(this.actionList)
        if (act) {
            this.workerAction = act
            this.fsm.changeState(act.actionType, true)
        } else {
            this.fsm.changeState(NORMAL_STAFF_ACTION.IDLE)
        }
    }


    onGotoRestEnter() {
        let endNode = Global.game.map.GetGameObject('restPoint' + this.index)
        if (endNode) {
            let path = Global.game.map.findPath(this.node.worldPosition, endNode.worldPosition.clone());
            if (path.length > 0) {
                this.goto(path, () => {
                    this.fsm.changeState(NORMAL_STAFF_ACTION.SLEEP)
                })
            } else {
                this.checkNextAction()
            }
        } else {
            this.checkNextAction()
        }

    }
    onGotoRestUpdate(dt: number) {
    }
    onRestingEnter() {
        this.moveEngine.running = false
        this.restingTime = Math.random() + 1
        this.createSleepState()
    }

    restingTime = 0
    onRestingUpdate(dt: number) {
        this.aidTime += dt
        if (this.aidTime > this.restingTime) {
            this.checkNextAction()
            this.aidTime = 0
        }
    }
    onRestingExit() {
        this.node.emit(GameConst.EventType.RemoveSleepState)
    }
    createSleepState() {
        return new Promise(async (resolve, reject) => {
            let infoNode: Node = await AssetPool.Instance().createObjAsync('stageui/SleepEffect', 'SleepEffect');
            infoNode.parent = Global.game.node_container
            infoNode.setWorldPosition(this.node.worldPosition.clone().add(v3(0, 2, 0)))
            let eff = infoNode.getComponent(SleepEffect)
            eff.target = this.node
            if (!this.fsm.isInState(NORMAL_STAFF_ACTION.SLEEP))
                this.node.emit(GameConst.EventType.RemoveSleepState)
        })

    }


    gotoCashierCounter() {
        let facility = Global.game.map.getMapItemById(FacilityID.CashierDesk)
        let endPos = v3()
        Vec3.subtract(endPos, facility.triggerAreaList[2].pos, v3(0, 0, -0.5))
        let path = Global.game.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {
            this.goto(path, () => {

            })
        } else {
            console.warn('gotoCashierCounter path error');
            this.checkNextAction()
        }
    }



    gotoPackageCounter() {
        let facility = Global.game.map.getMapItemById(FacilityID.PackageTable)
        let endPos = v3()
        Vec3.subtract(endPos, facility.triggerAreaList[2].pos, v3(0, 0, -0.5))
        let path = Global.game.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {
            this.goto(path, () => {

            })
        } else {
            console.error('gotoPackageCounter path error')
            this.checkNextAction()
        }
    }
    cleanGarbage() {
        let desk = Global.game.map.getSeatWithLitter()
        if (desk) {

            let nearPos = desk.node.worldPosition.clone()
            let path = Global.game.map.findPath(this.node.worldPosition.clone(), desk.node.worldPosition.clone());
            if (path.length > 0) {
                this.goto(path, () => {
                    if (!Global.game.checkConditions(this.workerAction.conditions))
                        this.checkNextAction()
                })
            } else {
                console.error('cleanGarbage path error')
                this.checkNextAction()
            }
        } else {
            this.checkNextAction()
        }
    }
    gotoGarbage() {

        let trashBoxNode = Global.game.map.getNodeByName('TrashBox')
        let path = Global.game.map.findPath(this.node.worldPosition, trashBoxNode.worldPosition.clone());
        if (path.length > 0) {
            this.goto(path, () => {

                if (!Global.game.checkConditions(this.workerAction.conditions)) {
                    this.checkNextAction()
                }
            })
        } else {
            console.error('gotoGarbage path error')
            this.checkNextAction()
        }
    }
    gotoDriveCarCounter() {
        let endNode = Global.game.map.getNodeByName('DriveCarCounterNode').getChildByName('model').getChildByName('DriveCarCounter_1').getChildByName('Board')
        let endPos = v3()
        Vec3.add(endPos, endNode.worldPosition.clone(), v3(1, 0, 0))
        let path = Global.game.map.findPath(this.node.worldPosition, endPos);
        if (path.length > 0) {
            this.goto(path, () => {
            })
        } else {
            console.error('gotoDriveCarCounter path error')
            this.checkNextAction()
        }
    }
    goto(path: Vec3[], callback: Function = null) {
        this.moveEngine.speed = Model.game.getStaffMoveSpeed()
        this.moveEngine.goto(path, callback)
        this.moveEngine.running = true
    }

    addOne(item: Node, leftCount: number = -1) {
        item.parent = this.GetGameObject('Burger')
        item.position = v3(0, this.stackList.length * 0.3, 0)
        item.getComponent(Item).delegate = this
        this.stackList.push(item)
        let type = item.getComponent(Item).type
        if (this.stackList.length >= Model.game.getStaffCarryMax() || leftCount == 0) {
            this.handleNext(type)
        }
    }
    handleNext(type: number) {
        this.moveEngine.running = false
        if (type == ItemType.Litter) {
            this.gotoGarbage()
        } else if (type == ItemType.Package) {
            this.gotoDriveCarCounter()
        } else if (type == ItemType.Burger) {
            if (this.workerAction.actionType == NORMAL_STAFF_ACTION.CARRY_TO_CASIER_COUNTER) {
                this.gotoCashierCounter()
            } else if (this.workerAction.actionType == NORMAL_STAFF_ACTION.CARRY_TO_PACKAGE_COUNTER) {
                this.gotoPackageCounter()
            }
        }
    }
    reduceOne(type: number = 0) {
        let item: Node = null
        if (this.stackList.length > 0) {
            if (type == 0) {
                item = this.stackList.pop()
            } else {
                for (let i = 0; i < this.stackList.length; i++) {
                    if (this.stackList[i].getComponent(Item).type == type) {
                        item = this.stackList[i]
                        this.stackList.splice(i, 1)
                        i--
                        break
                    }
                }
            }
            if (this.stackList.length == 0) {
                this.checkNextAction()
            }

        }
        return item
    }


    updateAni() {
        if (!this.moveEngine.running) {
            if (this.stackList.length == 0)
                this.playAni('Player_Idle')
            else
                this.playAni('Stack_Idle')
        } else {
            if (this.stackList.length == 0)
                this.playAni('player_run')
            else
                this.playAni('Stack_Run')
        }
    }
    private curAni: string = ''
    playAni(aniName) {
        if (this.curAni != aniName) {
            this.ani.play(aniName)
            this.curAni = aniName
        }

    }
    update(dt) {
        super.update(dt)
        this.updateAni()
        this.handleError(dt)
    }
    t = 0
    handleError(dt) {
        this.t += dt
        if (this.t > 1) {

            if (this.fsm.isInState(NORMAL_STAFF_ACTION.CARRY_TO_CASIER_COUNTER)) {
                if (this.stackList.length > 0) {
                    let type = this.stackList[0].getComponent(Item).type
                    if (type != ItemType.Burger) {
                        this.handleNext(type)
                    }
                }

            } else if (this.fsm.isInState(NORMAL_STAFF_ACTION.CARRY_TO_DRIVECAR_COUNTER)) {
                if (this.stackList.length > 0) {
                    let type = this.stackList[0].getComponent(Item).type
                    if (type != ItemType.Package) {
                        this.handleNext(type)
                    }
                }

            } else if (this.fsm.isInState(NORMAL_STAFF_ACTION.CARRY_TO_PACKAGE_COUNTER)) {
                if (this.stackList.length > 0) {
                    let type = this.stackList[0].getComponent(Item).type
                    if (type != ItemType.Burger) {
                        this.handleNext(type)
                    }
                }

            } else if (this.fsm.isInState(NORMAL_STAFF_ACTION.CLEAN_LITTER)) {
                if (this.stackList.length > 0) {
                    let type = this.stackList[0].getComponent(Item).type
                    if (type != ItemType.Litter) {
                        this.handleNext(type)
                    }
                }
            }
            this.t = 0
        }


    }

    canAdd(type: number) {
        let bol = this.stackList.length < Model.game.getStaffCarryMax();
        if (bol) {
            if (this.stackList.length > 0) {
                if (type != this.stackList[0].getComponent(Item).type)
                    return false
            }
            return true
        }
        return false

    }
    private _index: number = 0;
    public get index(): number {
        return this._index;
    }
    public set index(value: number) {
        this._index = value;
    }
}


