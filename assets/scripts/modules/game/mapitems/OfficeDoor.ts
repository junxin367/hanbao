import { _decorator, Node, tween, v3, Vec3 } from 'cc';
import { MapItemBase, TriggerArea } from './MapItemBase';
import { Global } from '../../../common/Global';
import { Role } from '../Role';
import { FacilityAreaType } from '../../../common/GameConst';
const { ccclass, property } = _decorator;

@ccclass('OfficeDoor')
export class OfficeDoor extends MapItemBase {
    start(): void {
        Global.game.map.addMapItem(this);
        this.initArea();
    }

    initArea() {
        this.triggerAreaList.push({ type: FacilityAreaType.DEFAULT, pos: this.wall_door.worldPosition, dis: 2 })
    }

    onTriggerExit(role: Role, triggerType: number) {
        if (triggerType != FacilityAreaType.DEFAULT) return;
        this.closeDoor(role.node)
    }

    onTriggerEnter(role: Role, triggerType: number) {
        if (triggerType != FacilityAreaType.DEFAULT) return;
        this.openDoor(role.node)
    }

    wall_door: Node = null;
    private getSide(role: Node, door: Node): number {
        let posDoor = door.getWorldPosition();
        let posRole = role.getWorldPosition();
        let dir = posRole.subtract(posDoor);

        let dotValue = Vec3.dot(dir, door.right);

        if (dotValue > 0) {
            return 1; 
        } else {
            return -1; 
        }
    }

    private _playing = false;
    openDoor(role: Node) {
        if (this._playing) return;
        tween(this.wall_door).stop();
        this._playing = true;
        let side = this.getSide(role, this.wall_door)
        if (side == 1) {
            tween(this.wall_door).to(0.3, { eulerAngles: v3(0, 90, 0) }).call(() => {
                this._playing = false
            }).start()
        } else {
            tween(this.wall_door).to(0.3, { eulerAngles: v3(0, -90, 0) }).call(() => {
                this._playing = false
            }).start()
        }
    }

    closeDoor(role: Node) {
        if (this._playing) return;
        tween(this.wall_door).stop();
        tween(this.wall_door).to(0.3, { eulerAngles: v3(0, 0, 0) }).start()
    }
}


