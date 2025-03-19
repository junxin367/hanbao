import { _decorator, Node, tween, v3, Vec3 } from 'cc';
import { MapItemBase, TriggerArea } from './MapItemBase';
import { Role } from '../Role';
import { FacilityAreaType } from '../../../common/GameConst';
const { ccclass, property } = _decorator;

@ccclass('Gate')
export class Gate extends MapItemBase {
    initArea() {
        super.initArea()
        this.triggerAreaList.push({ type: FacilityAreaType.DEFAULT, pos: this.Door_left.worldPosition.clone(), dis: 2 })
    }

    onTriggerExit(role: Role, triggerType: number) {
        super.onTriggerExit(role, triggerType);
        if (triggerType == FacilityAreaType.DEFAULT && this.unlock) {
            this.closeDoor(role.node, this.Door_left);
            this.closeDoor(role.node, this.Door_right);
           
        }
    }

    onTriggerEnter(role: Role, triggerType: number) {
        super.onTriggerEnter(role, triggerType);
        if (triggerType == FacilityAreaType.DEFAULT && this.unlock) {
            let side = this.getSide(role.node, this.Door_left)
            this.openDoor(this.Door_left, -side)
            this.openDoor(this.Door_right, side)
        }
    }

    Door_left: Node = null;
    Door_right: Node = null;
    private getSide(role: Node, door: Node): number {
        let posDoor = door.getWorldPosition();
        let posRole = role.getWorldPosition();
        let dir = posRole.subtract(posDoor);
        let dotValue = Vec3.dot(dir, door.forward);
        if (dotValue > 0) {
            return -1
        } else {
            return 1
        }
    }

    openDoor(door: Node, side: number) {
        tween(door).stop();
        if (side == 1) {
            tween(door).to(0.3, { eulerAngles: v3(0, 90, 0) }).start()
        } else {
            tween(door).to(0.3, { eulerAngles: v3(0, -90, 0) }).start()
        }
    }

    closeDoor(role: Node, door: Node) {
        tween(door).stop();
        tween(door).to(0.3, { eulerAngles: v3(0, 0, 0) }).start()
    }
}


