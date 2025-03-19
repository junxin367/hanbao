import { _decorator, Button, instantiate, Label, Layout, Node, Sprite, SpriteFrame, sys, Tween, tween, v2, v3 } from 'cc';
import BasePanel from '../../component/BasePanel';
import Model from '../../data/Model';
import GameConst, { BOOST_TIME, BOOST_TYPE, E_UPGRADE_TYPE } from '../../common/GameConst';
import Utils from '../../utils/Utils';
import { AudioMgr } from '../../utils/AudioMgr';
import WindowManager from '../../manager/WindowManager';
import GameData, { Upgrade } from '../../GameData';
import { GameManager } from '../game/GameManager';
import { Global } from '../../common/Global';
import AdManager from '../../manager/AdManager';
const { ccclass, property } = _decorator;
@ccclass('GameWin')
export class GameWin extends BasePanel {

    onBtnClicked(e: TouchEvent, name: string) {
        console.log("GameWin onBtnClicked", name)
        if (name == "btn_music") {
            AudioMgr.Instance().music = AudioMgr.Instance().music ? 0 : 1;

            this.btn_music.node.children[0].active = AudioMgr.Instance().music == 0;
        } else if (name == "btn_haptic") {
            AudioMgr.Instance().vibrate = AudioMgr.Instance().vibrate ? 0 : 1;

            this.btn_haptic.node.children[0].active = AudioMgr.Instance().vibrate == 0;
        } else if (name == "btn_setting") {
            this.node_menu.active = !this.node_menu.active;
        } else if (name == "btn_cleanbot") {
            WindowManager.Instance().open(GameConst.winPath.BoostWin, { type: BOOST_TYPE.CLEAN_BOT, node: this });
        } else if (name == "btn_upgrade") {
            let target: any = e.currentTarget;
            let info = target['cfg'] as Upgrade;
            console.log("btn_upgrade", info)

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
            target.active = false
        }
    }

    node_menu: Node = null;
    btn_cleanbot: Button = null;

    btn_music: Button = null;
    btn_haptic: Button = null;
    lbl_money: Label = null;
    protected start(): void {
        this.node_menu.active = false
        this.btn_music.node.children[0].active = AudioMgr.Instance().music == 0;
        this.btn_haptic.node.children[0].active = AudioMgr.Instance().vibrate == 0;
        this.showBotBtn();
        this.node_right.children.forEach(child => {
            child.active = false;
        })
    }

    private _last_up_upgrade_time: number = Date.now();
    protected update(dt: number): void {
        this.lbl_money.string = Model.game.money.toString();
        this.updateBootstUI();

        if (Model.game.guideID > 17 && Date.now() - this._last_up_upgrade_time > 50 * 1000) {
            this.refreshUpgradeUI();
            this._last_up_upgrade_time = Date.now();
        }
    }

    @property({ type: SpriteFrame })
    boost_inlineskate_blue: SpriteFrame = null;
    @property({ type: SpriteFrame })
    boost_inlineskate_pink: SpriteFrame = null;
    @property({ type: SpriteFrame })
    boost_gloves: SpriteFrame = null;
    @property({ type: SpriteFrame })
    clean_bot: SpriteFrame = null;
    @property({ type: SpriteFrame })
    phc: SpriteFrame = null;

    private showBotBtn() {
        if (Model.game.ProgressIds.indexOf(15) != -1) {
            this.btn_cleanbot.node.active = true
            tween(this.btn_cleanbot.node).to(0.3, { scale: v3(1.1, 1.1, 1.1) }).to(0.3, { scale: v3(1, 1, 1) }).union().repeatForever().start();
        } else {
            this.btn_cleanbot.node.active = false;
        }
    }

    private updateBootstUI() {
        if (!this.node_boost) return;
        for (var i = 0; i < this.node_boost.children.length; i++) {
            this.node_boost.children[i].active = false;
        }

        [BOOST_TYPE.BOOST_INLINESKATE_BLUE, BOOST_TYPE.BOOST_INLINESKATE_PINK, BOOST_TYPE.BOOST_GLOVES, BOOST_TYPE.CLEAN_BOT, BOOST_TYPE.PINGHENGCHE].forEach((type, index) => {
            let lefttime = Model.game.boost[type] || 0;
            if (lefttime <= 0) {
                if (type == BOOST_TYPE.CLEAN_BOT) {
                    if (!this.btn_cleanbot.node.active) {
                        this.showBotBtn();
                    }
                }
                return;
            }

            let node = this.node_boost.children[index];
            if (!node) {
                node = instantiate(this.node_boost.children[0]);
                node.parent = this.node_boost;
            }
            node.active = true;
            let sp_boost_icon = this.GetGameObject("sp_boost_icon", node, true)?.getComponent(Sprite);
            let sp_progress = this.GetGameObject("sp_progress", node, true)?.getComponent(Sprite);
            let lbl_boost_time = this.GetGameObject("lbl_boost_time", node, true)?.getComponent(Label);

            if (sp_progress) sp_progress.fillRange = lefttime / BOOST_TIME;
            if (lbl_boost_time) lbl_boost_time.string = Utils.formatSecond(lefttime);
            if (type == BOOST_TYPE.BOOST_INLINESKATE_BLUE) {
                sp_boost_icon.spriteFrame = this.boost_inlineskate_blue;
            } else if (type == BOOST_TYPE.BOOST_INLINESKATE_PINK) {
                sp_boost_icon.spriteFrame = this.boost_inlineskate_pink;
            } else if (type == BOOST_TYPE.BOOST_GLOVES) {
                sp_boost_icon.spriteFrame = this.boost_gloves;
            } else if (type == BOOST_TYPE.CLEAN_BOT) {
                this.btn_cleanbot.node.active = false;
                sp_boost_icon.spriteFrame = this.clean_bot;
            } else if (type == BOOST_TYPE.PINGHENGCHE) {
                sp_boost_icon.spriteFrame = this.phc;
            }
        })
    }

    node_boost: Node = null;

    private node_right: Node = null;
    private refreshUpgradeUI() {
        if (!this.node_right) return;
        for (let i = 0; i < this.node_right.children.length; i++) {
            this.node_right.children[i].active = false;
        }
        let list = Utils.objectToArray<Upgrade>(GameData.getUpgrade());
        list = list.filter(a => {
            if (a.Type == 2 && Global.game.staffs.length == 0) {
                return false;
            }
            let lv = Model.game.upgradeInfo[a.Id] || 0;
            let ismax = lv >= a.Cost.length - 1;
            if (ismax) return false;
            return true;
        })

        list = list.sort((a, b) => {
            return Math.random() > 0.5 ? 1 : -1;
        })

        for (let i = 0; i < list.length; ++i) {
            if (i > 1) break;
            let cfg = list[i];
            let node = this.node_right.children[i];
            if (!node) {
                node = instantiate(this.node_right.children[0]);
                this.node_right.addChild(node);
            }
            node.active = true;
            Tween.stopAllByTarget(node);
            tween(node).to(0.3, { scale: v3(1.1, 1.1, 1.1) }).
                to(0.3, { scale: v3(1, 1, 1) }).union().repeatForever().start()

            node["cfg"] = cfg;
            let lbl_name = node.getChildByName("lbl_name").getComponent(Label);
            lbl_name.string = cfg.Name;
            let sp_skill = node.getChildByName("sp_skill").getComponent(Sprite);
            this.setSpriteFrame(sp_skill, "ui/" + cfg.Icon + "/spriteFrame", "textures");

            node.getChildByName("green").active = cfg.Type == 1;
        }
    }
}


