import { _decorator, Component, Node, v3, Tween, tween } from 'cc';
import { FacilityAreaType, ItemType } from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import { AudioMgr } from '../../../utils/AudioMgr';
import GuideManager from '../../guide/GuideManager';
import { Player } from '../Player';
import { Role } from '../Role';
import { Item } from './Item';
import { MapItemBase } from './MapItemBase';
const { ccclass, property } = _decorator;

@ccclass('InitMoneyArea')
export class InitMoneyArea extends MapItemBase {
    initArea() {
        this.triggerAreaList.push({ type: FacilityAreaType.MONEY_COLLECTION, pos: this.node.worldPosition, dis: 0.5 })
    }
    async createInitMoney(earnMoney: number = 180) {

        for (let i = 0; i < 8; i++) {
            let item = await AssetPool.Instance().createObjAsync('entity/Money', 'Money');
            let idx = i
            item.position = v3(-Math.floor(idx / 4) % 2 * 0.65 + 0.5, Math.floor(idx / 8) * 0.1 + i * 0.005, idx % 8 % 4 * 0.35 - 0.5)
            item.parent = this.node
            item.getComponent(Item).type = ItemType.Money
            this.moneyStack.push(item)
        }

        this.earnMoney = earnMoney
        this.createMoney()
    }

    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.MONEY_COLLECTION && role instanceof Player && !this.playReduceAni && this.earnMoney > 0) {

            let player = Global.player
            player.addMoney(this.earnMoney,false)

            this.playMoneyReduceAni()
            this.earnMoney = 0

        } else {
            super.onTriggerStay(role, triggerType)
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
                this.moneyStack[i].setScale(v3(1, 1 + (floor - 1) * 0.6, 1))
            }
        }
    }

    playMoneyReduceAni() {
        this.playReduceAni = true

        for (const node of this.moneyStack) {
            Tween.stopAllByTarget(node)
            tween(node).to(0.25, { scale: v3(1, 0, 1) }).start()

        }
        this.schedule(()=>
        {
            AudioMgr.Instance().vibrateShort();
            AudioMgr.Instance().playSFX("papercup_edit");
        },0.02)
        this.scheduleOnce(() => {
            this.playReduceAni = false
            this.createMoney()
            GuideManager.Instance().onEventTrigger('onGetInitMoneyComplete')
            this.unscheduleAllCallbacks()
        }, 0.51)
        let node=this.GetGameObject('MoneyArea')
        if(!node)
            node=this.node
        Global.game.playMoneyAni(node.worldPosition.clone(), Global.player.node.worldPosition.clone())

    }
}


