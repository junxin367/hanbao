import { _decorator, Button, Component, Label, Node, ProgressBar, Sprite, SpriteFrame, tween, v3 } from 'cc';
import BasePanel from '../../component/BasePanel';
import AdManager from '../../manager/AdManager';
import Model from '../../data/Model';
import MsgHints from '../../component/MsgHints';
import { Global } from '../../common/Global';
import Utils from '../../utils/Utils';
import { AudioMgr } from '../../utils/AudioMgr';
import { InitMoneyArea } from '../game/mapitems/InitMoneyArea';

const { ccclass, property } = _decorator;

@ccclass('SpecialOrderWin')
export class SpecialOrderWin extends BasePanel {
    onBtnClicked(e: any, name: string) {
        AudioMgr.Instance().playSFX("papercup_edit")
        if (name == "btn_close") {
            this.close(true)
        } else if (name == "btn_ad") {
            if (!this.orderComplete()) {
                MsgHints.show("订单未完成")
                return;
            }
            AdManager.showVideo((code: number) => {
                if (code == 0) {

                    let node = new Node();
                    node.parent = Global.game.sceneNode;
                    node.position = Global.player.node.position.clone();
                    node.addComponent(InitMoneyArea).createInitMoney(this.money * 3);


                    Global.game.deliveryDriver.orderComplete();
                    this.close(true)
                }
            })
        } else if (name == "btn_get") {
            if (!this.orderComplete()) {
                MsgHints.show("订单未完成")
                return;
            }


            let node = new Node();
            node.parent = Global.game.sceneNode;
            node.position = Global.player.node.position.clone();
            node.addComponent(InitMoneyArea).createInitMoney(this.money);
            Global.game.deliveryDriver.orderComplete();
            this.close(true)
        }
    }

    private orderComplete() {
        let info = Model.game.deliveryDriverInfo;
        return info.put >= info.need;
    }


    btn_ad: Button = null;

    lbl_cur: Label = null;
    lbl_max: Label = null;
    progress_order: ProgressBar = null;
    node_succ: Node = null;
    lbl_price: Label = null;
    update(): void {
        let info = Model.game.deliveryDriverInfo;
        this.lbl_cur.string = info.put + "";
        this.lbl_max.string = "/" + info.need + "";
        this.progress_order.progress = info.put / info.need;

        this.node_succ.active = info.put >= info.need;
        this.money = 25 * Model.game.getBergerPrice() * Model.game.ProgressIds.length / 2;
        this.lbl_price.string = this.money + "";

        this.lbl_time.string = "订单剩余时间:" + Utils.formatSecond(info.time);

        if (info.time < 0 && info.put < info.need) {
            Global.game.deliveryDriver.orderFail();
        }
    }

    lbl_time: Label = null;
    private money: number = 0;
    onHide(): void {
        let callback = this.data.callback;
        if (callback) {
            callback();
        }
    }
}


