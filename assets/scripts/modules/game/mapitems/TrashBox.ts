import { _decorator, Component, Node } from 'cc';
import { FacilityAreaType, ItemType } from '../../../common/GameConst';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
import { AudioMgr } from '../../../utils/AudioMgr';
import GuideManager from '../../guide/GuideManager';
import { Player } from '../Player';
import { Role } from '../Role';
import { MapItemBase } from './MapItemBase';
const { ccclass, property } = _decorator;

@ccclass('TrashBox')
export class TrashBox extends MapItemBase {

    update(deltaTime: number) {

    }
    initArea() {
        this.triggerAreaList.push({ type: FacilityAreaType.TRASHBOX, pos: this.node.worldPosition, dis: 2.5 })
    }
    onTriggerStay(role: Role, triggerType: number) {

        if (triggerType == FacilityAreaType.TRASHBOX) {
            if (performance.now() - this.triggerTimeCount > 50) {
                this.triggerTimeCount = performance.now()

                let item = role.reduceOne()
                if (item) {

                    Global.game.flyTo(item, this.node, this.GetGameObject('Items_2').worldPosition.clone(), 0.25, () => {
                        AssetPool.Instance().put(item)
                    })
                    AudioMgr.Instance().playSFX('trash')

                    this.scheduleOnce(() => {
                        GuideManager.Instance().onEventTrigger('onThrowLitter')
                    }, 1)

                }
            }
        }


    }
}


