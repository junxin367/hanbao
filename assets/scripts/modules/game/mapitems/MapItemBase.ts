

//机器、桌子等

import { _decorator, Vec3, Label, Node, Prefab, instantiate, tween, v3, Tween } from 'cc';
import GameData, { ProgressConfig } from "../../../GameData";
import BaseComponent from "../../../component/Component";
import Utils from '../../../utils/Utils';
import ResHelper from '../../../utils/ResHelper';
import { AreaUnlockUI } from '../stageui/AreaUnlockUI';
import Model from '../../../data/Model';
import RegionalEditor from '../../map/RegionalEditor';
import { Global } from '../../../common/Global';
import { Role } from '../Role';
import GameConst, { FacilityAreaType, ItemType } from '../../../common/GameConst';
import { Player } from '../Player';
import AssetPool from '../../../component/AssetPool';
import { Item } from './Item';
import { AudioMgr } from '../../../utils/AudioMgr';

const { ccclass, property } = _decorator;


//和mapItem的碰撞触发器
export interface TriggerArea {
    type: number;
    pos: Vec3
    dis: number;//通过距离判断
}


@ccclass('MapItemBase')
export class MapItemBase extends BaseComponent {
    public cfg: ProgressConfig = null;
    protected binit = false;
    public unlockUI: AreaUnlockUI = null;
    public upgradeUI: AreaUnlockUI = null;
    protected model: Node = null;

    private node_leveUp: Node = null;

    public showLevelUp() {
        if (!this.node_leveUp) return;
        this.node_leveUp.active = true;
        tween(this.node_leveUp).delay(.8).call(() => {
            this.node_leveUp.active = false;
        }).start();
    }

    //存储列表
    public stackList: any[] = []

    //碰撞区域
    public triggerAreaList: TriggerArea[] = [];
    //辅助变量用来计数
    public triggerTimeCount: number = 0;
    //money相关
    protected playReduceAni: boolean = false
    protected moneyStack: Node[] = []
    protected earnMoney: number = 0

    start(): void {
        let progresslist = Utils.objectToArray<ProgressConfig>(GameData.getProgressConfig()).filter(a => a.Scene == 1);          //解锁规则
        this.cfg = progresslist.find(a => {
            return a.NodeName == this.node.name;
        });

        if (this.node_leveUp) this.node_leveUp.active = false;
        // console.log(this.node.name, this.cfg);
        this.node.active = true;
        if (this.cfg) {
            let open = Model.game.ProgressIds.indexOf(this.cfg.Id) != -1;
            this.model = this.node.getChildByName("model");

            let UpgradeArea = this.node.getChildByName("UpgradeArea");
            if (UpgradeArea) {
                ResHelper.loadResSync("stageui/AreaUnlockUI", "prefabs", Prefab).then((ret: Prefab) => {
                    let node = instantiate(ret);
                    node.parent = this.node;
                    node.worldPosition = UpgradeArea.worldPosition;
                    this.upgradeUI = node.getComponent(AreaUnlockUI);
                    this.upgradeUI.setCfg(this, true);
                    this.refreshState();
                })
            }

            if (!open) {
                ResHelper.loadResSync("stageui/AreaUnlockUI", "prefabs", Prefab).then((ret: Prefab) => {
                    let node = instantiate(ret);
                    node.parent = this.node;
                    node.position = Vec3.ZERO;
                    this.unlockUI = node.getComponent(AreaUnlockUI);
                    this.unlockUI.setCfg(this, false);
                    this.refreshState();
                })

            } else {
                this.refreshState();
            }

            this.getComponentsInChildren(RegionalEditor).forEach(it => {
                it.node.active = open;
            })
            this.onInit();

        }
        this.initArea();
        Global.game.map.addMapItem(this);
    }
    //初始化各个设施的区域
    initArea() {
        this.triggerAreaList.push({ type: FacilityAreaType.UNLOCK, pos: this.node.worldPosition, dis: 1 })
        this.triggerAreaList.push({ type: FacilityAreaType.UPGRADE, pos: this.GetGameObject('UpgradeArea')?.worldPosition, dis: 1 })
    }

    onInit() {

    }

    refreshState(animation: boolean = false) {
        // if (this.cfg?.Id == 15) {
        //     debugger;
        // }
        if (this.model) this.model.active = this.unlock;
        if (this.unlockUI) this.unlockUI.node.active = this.checkCanUnlock();
        if (this.upgradeUI) this.upgradeUI.node.active = this.checkCanUpgrade()
        this.GetGameObjects("obstacle").forEach(a => a.active = this.unlock);
        this.node.active = true;

        if (this.model && animation) {
            this.model.scale = v3(0.1, 0.1, 0.1);
            tween(this.model).to(0.25, { scale: v3(1.1, 1.1, 1.1) }).to(0.25, { scale: v3(1, 1, 1) }).start()
        }
        if (animation)
            this.onBuild()
    }

    protected lateUpdate(dt: number): void {
        if (this.upgradeUI) this.upgradeUI.node.active = this.checkCanUpgrade()
        if (this.unlockUI) this.unlockUI.node.active = this.checkCanUnlock();
    }

    //检查是否可以解锁
    checkCanUnlock() {
        if (this.unlock) return false;

        //如果免费 并且前置条件满足 直接解锁
        if (this.cfg.MoneyCost == 0 && Model.game.ProgressIds.indexOf(this.cfg.PreLimit) != -1) {
            Model.game.ProgressIds.push(this.cfg.Id);
            this.refreshState(true);
            Model.save();
            return false
        }


        if (Model.game.ProgressIds.indexOf(this.cfg.PreLimit) != -1 || this.cfg.PreLimit == 0) {
            return true
        }
        if (Model.game.MoneyPutInfo[this.cfg.Id] >= this.cfg.MoneyCost) {
            return false
        }

        return false
    }
    //这个地方需要判断上限
    checkCanUpgrade() {
        if (!this.unlock) return false;
        if (Model.game.guideID < 12) return false
        let key = this.cfg.Id + "_up";
        let lv = Model.game.mapItemLv[key] || 0;
        let cost = this.cfg.UpgradeCost[lv];
        if (!Model.game.MoneyPutInfo[key]) Model.game.MoneyPutInfo[key] = 0;
        if (cost) return true
        return false
    }


    get unlock() {
        // if (this.cfg.MoneyCost == 0 && this.cfg.PreLimit == 0 && Model.game.ProgressIds.indexOf(this.cfg.Id) == -1) {
        //     Model.game.ProgressIds.push(this.cfg.Id)
        //     Model.save();
        // }
        return Model.game.ProgressIds.indexOf(this.cfg.Id) != -1;
    }


    update(dt: number) {
        if (this.unlockUI) this.unlockUI.node.active = this.checkCanUnlock();
    }

    reduceOne(item: any = null) {

    }
    addOne(item: any = null) {

    }
    //处理和角色的各种碰撞
    onTriggerEnter(role: Role, triggerType: number) {
        if (!(role instanceof Player)) return;
        this.triggerTimeCount = 0
        if (triggerType === FacilityAreaType.UNLOCK && this.checkCanUnlock())
            this.unlockUI?.playerEnter(false)
        else if (triggerType === FacilityAreaType.UPGRADE && this.checkCanUpgrade())
            this.upgradeUI?.playerEnter(true)
    }
    onTriggerExit(role: Role, triggerType: number) {
        if (!(role instanceof Player)) return;
        if (triggerType === FacilityAreaType.UNLOCK && this.checkCanUnlock())
            this.unlockUI?.playerExit(false)
        else if (triggerType === FacilityAreaType.UPGRADE && this.checkCanUpgrade())
            this.upgradeUI?.playerExit(true)
    }
    onTriggerStay(role: Role, triggerType: number) {
        if (!(role instanceof Player)) return;
        if (triggerType === FacilityAreaType.UNLOCK && this.checkCanUnlock())
            this.unlockUI?.playerStay(false)
        else if (triggerType === FacilityAreaType.UPGRADE && this.checkCanUpgrade())
            this.upgradeUI?.playerStay(true)
    }
    //当创建的时候
    onBuild() {

    }
    //当升级的时候
    onUpgrade() {

    }

    //初始创建8个货币，增加的时候改变其size
    async initMoney() {
        let moneyArea = this.GetGameObject('MoneyArea')
        for (let i = 0; i < 8; i++) {
            let item = await AssetPool.Instance().createObjAsync('entity/Money', 'Money');
            let idx = this.moneyStack.length
            item.position = v3(-Math.floor(idx / 4) % 2 * 0.65 + 0.5, Math.floor(idx / 8) * 0.1 + i * 0.005 + 0.02, idx % 8 % 4 * 0.35 - 0.5)
            item.parent = moneyArea
            item.getComponent(Item).type = ItemType.Money
            this.moneyStack.push(item)
            item.active = false
        }
    }

    createMoney() {
        if (this.playReduceAni) return
        if (this.earnMoney <= 8) {
            for (let i = 0; i < 8; i++) {
                if (this.earnMoney > i)
                    this.moneyStack[i].active = true
                else
                    this.moneyStack[i].active = false
            }
        } else {
            let floor = Math.floor(this.earnMoney / 8)
            for (let i = 0; i < 8; i++) {
                this.moneyStack[i].active = true
                this.moneyStack[i].setScale(v3(1, 1 + (floor - 1) * 0.2, 1))
            }
        }
    }

    playMoneyReduceAni() {
        this.playReduceAni = true

        for (const node of this.moneyStack) {
            Tween.stopAllByTarget(node)
            tween(node).to(0.25, { scale: v3(1, 0, 1) }).start()


        }

        this.schedule(() => {
            AudioMgr.Instance().vibrateShort();
            AudioMgr.Instance().playSFX("papercup_edit");
        }, 0.02)


        this.scheduleOnce(() => {
            this.playReduceAni = false
            this.createMoney()//有可能播放动画期间有金钱增加 
            AudioMgr.Instance().playSFX('cash')
            this.unscheduleAllCallbacks()
        }, 0.51)

        Global.game.playMoneyAni(this.GetGameObject('MoneyArea').worldPosition.clone(), Global.player.node.worldPosition.clone())

    }

}


