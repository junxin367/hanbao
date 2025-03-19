import { _decorator, Button, Component, Label, Node, Sprite, tween, v3 } from 'cc';
import BasePanel from '../../component/BasePanel';
import GameData, { Upgrade } from '../../GameData';
import Utils from '../../utils/Utils';
import Model from '../../data/Model';
import AdManager from '../../manager/AdManager';
import MsgHints from '../../component/MsgHints';
import { E_UPGRADE_TYPE } from '../../common/GameConst';
import { Global } from '../../common/Global';
import { AudioMgr } from '../../utils/AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('UpgradeWin')
export class UpgradeWin extends BasePanel {
    onBtnClicked(e: any, name: string) {
        AudioMgr.Instance().playSFX("papercup_edit")
        if (name == "btn_close") {
            this.close(true)
        }
    }
    node_items: Node = null;
    lbl_title: Label = null;
    onShow(type: number): void {
        this.lbl_title.string = type == 1 ? "主角升级" : "员工升级";
        // console.log(Model.game.sceneId)
        let list = Utils.objectToArray<Upgrade>(GameData.getUpgrade()).filter(a => a.Sence == Model.game.sceneId && a.Type == type);
        this.node_items.children.forEach((child, i) => {
            let info = list[i];
            let lbl_name = child.getChildByName("lbl_name").getComponent(Label);
            lbl_name.string = info.Name;
            let sp_skill = child.getChildByName("sp_skill").getComponent(Sprite);
            this.setSpriteFrame(sp_skill, "ui/" + info.Icon + "/spriteFrame", "textures");

            let lv = Model.game.upgradeInfo[info.Id] || 0;
            let cost = info.Cost[lv];

            let ismax = lv >= info.Cost.length - 1;

            let btn_ad = child.getChildByName("btn_ad").getComponent(Button);
            let btn_money = child.getChildByName("btn_money").getComponent(Button);
            let lbl_cost_ad = btn_ad.node.getChildByName("lbl_cost").getComponent(Label);
            let lbl_cost_money = btn_money.node.getChildByName("lbl_cost").getComponent(Label);
            if (ismax) {
                btn_ad.interactable = false;
                btn_money.interactable = false;
                lbl_cost_ad.string = "满级";
                lbl_cost_money.string = "满级";
            } else {
                lbl_cost_ad.string = "免费";
                lbl_cost_money.string = cost == 0 ? "免费" : cost + "";
                this.addClick(btn_ad.node, "onClickAd", info);
                this.addClick(btn_money.node, "onClickMoney", info);
            }
        })

        if (Model.game.upgradeInfo[3] == undefined) {
            tween(this.node_finger).to(0.3, { scale: v3(1.2, 1.2, 1.2) }).
                to(0.3, { scale: v3(1, 1, 1) }).union().repeatForever().start()
        }

    }

    protected update(dt: number): void {
        this.node_finger.active = Model.game.upgradeInfo[3] == undefined;
    }


    private node_finger: Node = null;

    private onClickAd(e, info: Upgrade) {
        AudioMgr.Instance().playSFX("papercup_edit")
        AdManager.showVideo((code: number) => {
            if (code == 0) {
                Model.game.upgradeInfo[info.Id] = (Model.game.upgradeInfo[info.Id] || 0) + 1;
                this.onShow(info.Type);

                if (info.Id == E_UPGRADE_TYPE.STAFF_COUNT) {
                    let item = Global.game.map.allMapItems.find(a => a.cfg && a.cfg.Type == 5);
                    Global.game.createNormalStaff(item.node.worldPosition.clone(), info.Id)
                }
                Model.save();
            }
        })
    }


    private onClickMoney(e, info: Upgrade) {
        AudioMgr.Instance().playSFX("papercup_edit")
        let lv = Model.game.upgradeInfo[info.Id] || 0;
        let cost = info.Cost[lv];
        if (Model.game.money >= cost) {
            Model.game.upgradeInfo[info.Id] = (Model.game.upgradeInfo[info.Id] || 0) + 1;
            Model.game.money -= cost;
            this.onShow(info.Type);

            if (info.Id == E_UPGRADE_TYPE.STAFF_COUNT) {
                let item = Global.game.map.allMapItems.find(a => a.cfg && a.cfg.Type == 5);
                Global.game.createNormalStaff(item.node.worldPosition.clone(), info.Id)
            }
            Model.save();
        } else {
            MsgHints.show("金币不足")
        }
    }
}


