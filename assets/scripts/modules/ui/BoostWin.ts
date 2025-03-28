import { _decorator, Button, Component, isValid, Label, Node, ProgressBar, Sprite, SpriteFrame, tween, v3 } from 'cc';
import BasePanel from '../../component/BasePanel';
import { BOOST_TIME, BOOST_TYPE } from '../../common/GameConst';
import AdManager from '../../manager/AdManager';
import AssetPool from '../../component/AssetPool';
import Model from '../../data/Model';
import { BoostItem } from '../game/mapitems/BoostItem';
import { GameManager } from '../game/GameManager';
import { Global } from '../../common/Global';
import { AudioMgr } from '../../utils/AudioMgr';
import { InitMoneyArea } from '../game/mapitems/InitMoneyArea';

const { ccclass, property } = _decorator;

@ccclass('BoostWin')
export class BoostWin extends BasePanel {
    progress_battery: ProgressBar = null;
    onBtnClicked(e: any, name: string) {
        AudioMgr.Instance().playSFX("papercup_edit")
        if (name == "btn_close") {
            this.close(true)
        } else if (name == "btn_ad") {
            AdManager.showVideo((code: number) => {
                if (code == 0) {
                    if (this.type == BOOST_TYPE.MONEY) {
                        let node = new Node();
                        node.parent = Global.game.sceneNode;
                        node.position = Global.player.node.position.clone();
                        node.addComponent(InitMoneyArea).createInitMoney(this.adMoney);
                    } else {
                        Model.game.boost[this.type] = BOOST_TIME;
                        Model.save();
                    }

                    if (isValid(this.data.node) && this.data.node.getComponent(BoostItem)) {
                        Global.game.map.removeMapItem(this.data.node);
                        AssetPool.Instance().put(this.data.node);
                    }

                    if (this.type == BOOST_TYPE.CLEAN_BOT) {
                        this.btn_ad.node.active = false;
                        this.progress_battery.progress = 0;
                        tween(this.progress_battery).to(1, { progress: 1 }).call(() => {
                            this.close(true);
                        }).start()
                    } else {
                        this.close(true);
                    }
                }
            })
        } else if (name == "btn_free") {

            Model.game.boost[this.type] = BOOST_TIME;
            Model.save();
            this.close(true);
        }
    }

    btn_ad: Button = null;
    node_effect: Node = null;
    protected update(dt: number): void {
        this.node_effect.angle += 100 * dt;
    }

    @property({ type: SpriteFrame })
    boost_inlineskate_blue: SpriteFrame = null;
    @property({ type: SpriteFrame })
    boost_inlineskate_pink: SpriteFrame = null;
    @property({ type: SpriteFrame })
    boost_gloves: SpriteFrame = null;
    @property({ type: SpriteFrame })
    bot: SpriteFrame = null;
    @property({ type: SpriteFrame })
    money: SpriteFrame = null;
    @property({ type: SpriteFrame })
    phc: SpriteFrame = null;


    sp_skill: Sprite = null;
    lbl_name: Label = null;
    lbl_title: Label = null;
    node_battery: Node = null;
    private type: BOOST_TYPE = BOOST_TYPE.BOOST_GLOVES
    onShow(info: { type: BOOST_TYPE, node: BoostItem }): void {
        this.type = info.type;
        tween(this.sp_skill.node).to(0.3, { scale: v3(1.1, 1.1, 1.1) }).to(0.3, { scale: v3(1, 1, 1) }).union().repeatForever().start();

        this.btn_free.node.active = this.type == BOOST_TYPE.PINGHENGCHE;
        this.btn_ad.node.active = this.type != BOOST_TYPE.PINGHENGCHE;
        this.node_battery.active = false;
        if (this.type == BOOST_TYPE.BOOST_GLOVES) {
            this.sp_skill.spriteFrame = this.boost_gloves;
            this.lbl_name.string = "玩家搬运数量增加180%";
            this.lbl_title.string = "手套";
        }
        else if (this.type == BOOST_TYPE.BOOST_INLINESKATE_BLUE) {
            this.sp_skill.spriteFrame = this.boost_inlineskate_blue;
            this.lbl_name.string = "玩家移动速度增加180%";
            this.lbl_title.string = "蓝色滑轮";
        }
        else if (this.type == BOOST_TYPE.BOOST_INLINESKATE_PINK) {
            this.sp_skill.spriteFrame = this.boost_inlineskate_pink;
            this.lbl_name.string = "玩家移动速度增加180%"
            this.lbl_title.string = "粉色滑轮";
        }
        else if (this.type == BOOST_TYPE.PINGHENGCHE) {
            this.sp_skill.spriteFrame = this.phc;
            this.lbl_name.string = "平衡车免费试用"
            this.lbl_title.string = "平衡车";
        }
        else if (this.type == BOOST_TYPE.CLEAN_BOT) {
            this.lbl_name.string = "充电"
            this.lbl_title.string = "清洁机器人";
            this.sp_skill.spriteFrame = this.bot;
            this.node_battery.active = true;

            let t = Model.game.boost[BOOST_TYPE.CLEAN_BOT]
            if (t > 0) {
                this.progress_battery.progress = t / BOOST_TIME;
            } else {
                this.progress_battery.progress = 0;
            }

        }
        else if (this.type == BOOST_TYPE.MONEY) {
            this.sp_skill.spriteFrame = this.money;
            this.lbl_title.string = "免费金币";
            this.adMoney = Model.game.getCurAdMoney();
            this.lbl_name.string = "+" + this.adMoney
        }


    }

    btn_free: Button = null;


    private adMoney: number = 0;
}


