import { _decorator, Component, Node, log } from 'cc';
import { MapItemBase } from './MapItemBase';
import GameConst, { BOOST_TYPE, FacilityAreaType } from '../../../common/GameConst';
import WindowManager from '../../../manager/WindowManager';
import { Role } from '../Role';
import { Player } from '../Player';
import { Global } from '../../../common/Global';
import { EventManager, EventType } from '../../../event/EventManager';
const { ccclass, property } = _decorator;

@ccclass('CleanerArea')
export class CleanerArea extends MapItemBase {
    initArea() {
        this.triggerAreaList.length = 0;
        this.triggerAreaList.push({ type: FacilityAreaType.BOOST_AREA, pos: this.node.worldPosition.clone(), dis: 1 })
    }
    // onUnlockMapItem() {
    //    // this.node.active = Global.game.map.getOpenDeskCount() >= 4
    // }

    // protected onEnable(): void {
    //     EventManager.Inst.on(EventType.EVT_UNLOCK_MAPITEM, this, this.onUnlockMapItem);
    // }

    protected onDisable(): void {
        EventManager.Inst.offAllCaller(this);
    }


    onTriggerExit(role: Role, triggerType: number) {
    }

    onTriggerEnter(role: Role, triggerType: number) {
        if (!this.unlock) return;
        if (triggerType != FacilityAreaType.BOOST_AREA) return;
        if (!(role instanceof Player)) return;
        console.log("BOOST ENTER")
        WindowManager.Instance().open(GameConst.winPath.BoostWin, { type: BOOST_TYPE.CLEAN_BOT, node: this });
    }

}


