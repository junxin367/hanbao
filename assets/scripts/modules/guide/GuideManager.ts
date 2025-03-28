import { _decorator, Component, Node, log, Vec3, v3 } from 'cc';
import GameConst from '../../common/GameConst';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import Model from '../../data/Model';
import Singleton from '../../manager/Singleton';
import WindowManager from '../../manager/WindowManager';
import { GuideArrow } from './GuideArrow';
import { GuideNode } from './GuideNode';


interface GuideStep {
    message: string;
    type: number 
    id: number
    triggerNext: string 
    target: string
    arrowOffset: Vec3
    rollback: number 
    focus: boolean
}


export default class GuideManager extends Singleton {
    private guideSteps: GuideStep[] = [];
    currentGuideId: number = 1;
    currentStep: GuideStep
    arrow: GuideArrow

    constructor() {
        super()

        const guideSteps: GuideStep[] = [
            { id: 1, message: '收取初始资金', type: 1, triggerNext: 'onGetInitMoneyComplete', target: 'initMoneyArea', arrowOffset: v3(0, 2, 0), rollback: -1, focus: false },
            { id: 2, message: '修建一个大门', type: 1, triggerNext: 'onCreateFacility1', target: 'DoorCreate', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 3, message: '', type: 2, triggerNext: 'onAniPlayComplete', target: '', arrowOffset: null, rollback: 4, focus: false },
            { id: 4, message: '修建一个桌子', type: 1, triggerNext: 'onCreateFacility2', target: 'firstTable', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 5, message: '修建一个汉堡机', type: 1, triggerNext: 'onCreateFacility3', target: 'burgerMachine', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 6, message: '修建一个收银台', type: 1, triggerNext: 'onCreateFacility4', target: 'counter', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 7, message: '拾取汉堡', type: 1, triggerNext: 'onGetBurger', target: 'burgerPos', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 8, message: '把汉堡放在收银台上面', type: 1, triggerNext: 'onPutBurger', target: 'CounterFood', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 9, message: '售卖汉堡', type: 1, triggerNext: 'onSellBurger', target: 'CounterSell', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 10, message: '', type: 1, triggerNext: 'hasLitter', target: '', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 11, message: '清理桌子', type: 1, triggerNext: 'onGetLitter', target: 'firstTable', arrowOffset: v3(0, 2, 0), rollback: 10, focus: true },
            { id: 12, message: '把垃圾扔到垃圾箱', type: 1, triggerNext: 'onThrowLitter', target: 'trashBox', arrowOffset: v3(0, 2, 0), rollback: -1, focus: true },
            { id: 13, message: '雇佣一个收银员', type: 1, triggerNext: '4_up', target: 'cashier', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 14, message: '再创建一个桌子', type: 1, triggerNext: 'onCreateFacility5', target: 'secondTable', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 15, message: '创建一个员工升级办公室', type: 1, triggerNext: 'onCreateFacility6', target: 'hrOffice', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 16, message: '创建一个玩家升级办公室', type: 1, triggerNext: 'onCreateFacility7', target: 'playerOffice', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 17, message: '创建一个外卖台', type: 1, triggerNext: 'onCreateFacility8', target: 'driveCarCounter', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 18, message: '创建一个打包台', type: 1, triggerNext: 'onCreateFacility9', target: 'packageCounter', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 19, message: '拾取汉堡', type: 1, triggerNext: 'onGetBurger', target: 'burgerPos', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 20, message: '把汉堡放在打包台', type: 1, triggerNext: 'onPutBurgerToPackage', target: 'packageBurgerPos', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 21, message: '', type: 1, triggerNext: 'onPackageBox', target: '', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 22, message: '搬运打包盒', type: 1, triggerNext: 'onGetBurgerBox', target: 'burgerBox', arrowOffset: v3(0, 1, 0), rollback: -1, focus: false },
            { id: 23, message: '放置到外卖台上', type: 1, triggerNext: 'onPutBox', target: 'driveFoodPos', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
            { id: 24, message: '', type: 999, triggerNext: 'todo', target: '', arrowOffset: v3(0, 1, 0), rollback: -1, focus: true },
        ];

        this.guideSteps = guideSteps;
        this.currentGuideId = Model.game.guideID
        this.currentStep = this.guideSteps.find(element => element.id == this.currentGuideId)
        if (this.currentStep && this.currentStep.rollback > 0) {
            this.currentGuideId = this.currentStep.rollback
        }
        log('当前引导ID', this.currentGuideId)
    }


    async startGuide() {
        await this.createArrow()
        this.showNextStep();
    }
    async createArrow() {
        let arrow = await AssetPool.Instance().createObjAsync('ui/GuideArrow', 'GuideArrow');
        arrow.parent = Global.game.node_container
        arrow.active = false;
        this.arrow = arrow.getComponent(GuideArrow)
    }


    private showNextStep() {
        this.hideGuide()
        this.currentStep = this.guideSteps.find(element => element.id == this.currentGuideId)

        if (this.currentStep) {
            this.showGuide(this.currentStep);
        }




    }
    onEventTrigger(name: string) {
        if (this.currentStep.triggerNext == name) {
            this.currentGuideId++
            this.saveGuideProgress()
            this.showNextStep()
        }
    }


    private showGuide(step: GuideStep) {
        if (step.id == 1) {
            Global.game.createInitMoney()
        }
        if (step.type == 2) {
            Global.game.focusToDoor()
        }
        if (step.target != '') {
            let target = this.getGuideNode(step.target)
            log('查找', step.target, target, this.arrow)
            if (target) {
                this.arrow.node.worldPosition = target.node.worldPosition.clone().add(step.arrowOffset)
                this.arrow.node.active = true

                if (step.focus) {
                    Global.camera.addLookAtNode(target.node, null, 0.8)
                  
                }
                let v = v3()
                Vec3.add(v, target.node.worldPosition, v3(0, 4, 0))
                Global.player.setAimPos(v)
            }

        }
        if (step.message != '') {
            WindowManager.Instance().open(GameConst.winPath.GuideTalkWin, step.message)
        }
    }
    getGuideNode(name: string) {
        let nodes = Global.game.map.getComponentsInChildren(GuideNode)
        for (const node of nodes) {
            if (node.gName == name) {
                return node
            }
        }
        return null
    }


    public hideGuide() {
        this.arrow.node.active = false
        WindowManager.Instance().removeWindow(GameConst.winPath.GuideTalkWin, true)
        Global.player.setAimPos(null)
    }


    private saveGuideProgress() {
        Model.game.guideID = this.currentGuideId
        Model.save()
    }



}










