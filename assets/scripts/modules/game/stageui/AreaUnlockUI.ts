import { _decorator, Component, Label, Node, v3 } from 'cc';
import BaseComponent from '../../../component/Component';
import MeshText from '../../../utils/MeshText';
import { MapItemBase } from '../mapitems/MapItemBase';
import Model from '../../../data/Model';
import { EventManager, EventType } from '../../../event/EventManager';

import { Global } from '../../../common/Global';
import GuideManager from '../../guide/GuideManager';
import { AudioMgr } from '../../../utils/AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('AreaUnlockUI')
export class AreaUnlockUI extends BaseComponent {

    private meshtext: MeshText = null;
    private isupgrade: boolean = false;
    public setCfg(mapitem: MapItemBase, isupgrade: boolean) {
        this.mapitem = mapitem;
        this.isupgrade = isupgrade;
        this.meshtext = this.node.getComponentInChildren(MeshText);
        this.refreshUI();
    }
    private progress: Node = null;
    private refreshUI() {
        let pro = 0;
        if (this.isupgrade) {
            let key = this.mapitem.cfg.Id + "_up";
            let lv = Model.game.mapItemLv[key] || 0;
            let cost = this.mapitem.cfg.UpgradeCost[lv];
            if (!Model.game.MoneyPutInfo[key]) Model.game.MoneyPutInfo[key] = 0;
            if (cost) {
                pro = Model.game.MoneyPutInfo[key] / cost;
                this.meshtext.text = (cost - Model.game.MoneyPutInfo[key]) + "";
            } else {
                //满级
                this.node.active = false;
            }
        } else {
            let key = this.mapitem.cfg.Id;
            if (!Model.game.MoneyPutInfo[key]) Model.game.MoneyPutInfo[key] = 0;
            pro = Model.game.MoneyPutInfo[key] / this.mapitem.cfg.MoneyCost;
            this.meshtext.text = (this.mapitem.cfg.MoneyCost - Model.game.MoneyPutInfo[key]) + "";
        }
        if (this.progress)
            this.progress.setScale(v3(1, 1, pro))
    }

    mapitem: MapItemBase = null;
    //放入钱
    private putcashtime = 0;
    private putCash(isupgrade: boolean) {
        if (Date.now() - this.putcashtime < 50) return false;
        let cfg = this.mapitem.cfg;
        let key: any = this.mapitem.cfg.Id;
        if (isupgrade) {
            key = this.mapitem.cfg.Id + "_up";
        }
        this.putcashtime = Date.now();

        if (!Model.game.MoneyPutInfo[key]) Model.game.MoneyPutInfo[key] = 0;
        let value = 0;

        let cost = this.mapitem.cfg.MoneyCost;
        if (isupgrade) {
            let lv = Model.game.mapItemLv[key] || 0;
            cost = this.mapitem.cfg.UpgradeCost[lv];
        }
        let need = cost - Model.game.MoneyPutInfo[key];


        let tmp = Math.floor(need / 10);
        if (tmp > 50) tmp = 50

        if (Model.game.money >= tmp)
            value = tmp;

        if (tmp > Model.game.money) {
            value = Model.game.money
        }

        if (tmp < 10 && Model.game.money >= 10)
            value = 10;

        if (tmp < 1 && Model.game.money >= 1) value = 1;

        if (tmp < 1 && Model.game.money >= 1)
            value = 1;

        if (value) {
            Model.game.MoneyPutInfo[key] += value;
            Model.game.money -= value;
            AudioMgr.Instance().vibrateShort();
            AudioMgr.Instance().playSFX("papercup_edit");
            this.refreshUI();
            Global.game.playMoneyAni(Global.player.node.worldPosition.clone(), this.node.worldPosition.clone(), 1)
        } else {
            //钱不够
            EventManager.Inst.event(EventType.NotEnoughMoney)
        }

        if (isupgrade) {
            let lv = Model.game.mapItemLv[key] || 0;
            if (Model.game.MoneyPutInfo[key] >= cfg.UpgradeCost[lv]) {
                return true;
            }
        } else {
            if (Model.game.MoneyPutInfo[key] >= cfg.MoneyCost) {
                return true;
            }
        }

        return false;
    }

    playerStay(isupgrade: boolean) {
        if (this._bupgraded) return;
        let b = this.putCash(isupgrade);
        if (b) {
            AudioMgr.Instance().playSFX("UnlockSystem")
            this._bupgraded = true;
            if (!isupgrade) {
                if (Model.game.ProgressIds.indexOf(this.mapitem.cfg.Id) == -1) {
                    Model.game.ProgressIds.push(this.mapitem.cfg.Id);
                    Model.save();
                    EventManager.Inst.event(EventType.EVT_UNLOCK_MAPITEM, this.mapitem.cfg.Id);
                }
            } else {

                this.mapitem.showLevelUp();

                let key = this.mapitem.cfg.Id + "_up";
                Model.game.MoneyPutInfo[key] = 0;
                if (!Model.game.mapItemLv[key]) Model.game.mapItemLv[key] = 0;
                Model.game.mapItemLv[key]++;
                this.mapitem.onUpgrade && this.mapitem.onUpgrade()
                Model.save();
                this.refreshUI();
                this.scheduleOnce(() => {
                    GuideManager.Instance().onEventTrigger(key)
                }, 1)

            }
        }
    }

    private _bupgraded = false
    playerExit(isupgrade: boolean) {
        this._bupgraded = false;
        Model.save();
        this.node.setScale(v3(1.5, 1.5, 1.5))
    }
    playerEnter(isupgrade: boolean) {
        this._bupgraded = false;
        this.node.setScale(v3(1.8, 1.8, 1.8))
    }

}