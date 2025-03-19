import { _decorator, instantiate, Node, Prefab, tween, v3 } from 'cc';
import { MapItemBase, } from './MapItemBase';
import { Role } from '../Role';
import ResHelper from '../../../utils/ResHelper';
import WindowManager from '../../../manager/WindowManager';
import GameConst, { E_UPGRADE_TYPE, FacilityAreaType } from '../../../common/GameConst';
import Model from '../../../data/Model';
import { Global } from '../../../common/Global';
import { Player } from '../Player';
import { AudioMgr } from '../../../utils/AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('UpgradeOffice')
export class UpgradeOffice extends MapItemBase {

    initArea() {
        if (this.unlock) {
            this.triggerAreaList.push({ type: FacilityAreaType.UPGRADE_OFFICE, pos: this.staffpos.worldPosition, dis: 3.5 })
        } else {
            super.initArea()
        }
    }

    onTriggerExit(role: Role, triggerType: number) {
        if (role instanceof Player) {
            if (!this.unlock) return
            WindowManager.Instance().removeWindow(GameConst.winPath.UpgradeWin, true);
        }
    }

    onTriggerEnter(role: Role, triggerType: number) {
        if (role instanceof Player) {
            if (!this.unlock) return
            let type = 1
            if (this.cfg.Type == 5) {
                type = 2;
            } else if (this.cfg.Type == 6) {
                type = 1
            }
            
            AudioMgr.Instance().playSFX("papercup_edit");
            WindowManager.Instance().open(GameConst.winPath.UpgradeWin, type);
        }

    }
    staffpos: Node = null;

    onBuild() {
        if (this.cfg && this.unlock) {
            let type = 1
            if (this.cfg.Type == 5) {
                type = 2;
            } else if (this.cfg.Type == 6) {
                type = 1
            }
            
            AudioMgr.Instance().playSFX("papercup_edit");
            WindowManager.Instance().open(GameConst.winPath.UpgradeWin, type);
        }
    }


    onInit() {
        //员工
        if (this.cfg.Type == 5 || this.cfg.Type == 6) {
            ResHelper.loadResSync("entity/OfficeStaff", "prefabs", Prefab).then((ret: Prefab) => {
                let node = instantiate(ret);
                node.parent = this.model;
                node.worldPosition = this.staffpos.worldPosition;
                node.setRotation(this.staffpos.getRotation());
            })
        }
        //添加打杂的员工

        let cn = Model.game.upgradeInfo[E_UPGRADE_TYPE.STAFF_COUNT]
        if (cn > 0 && this.cfg.Type == 5) {
            for (let  i = 0; i < cn; ++i) {
                tween(this.node).delay(i + 1).call(() => {
                    Global.game.createNormalStaff(this.node.worldPosition.clone(),i+1)
                }).start();
            }
        }
    }
}


