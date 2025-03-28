import { _decorator, Component, instantiate, Node, Prefab, v3 } from 'cc';
import { MapItemBase, } from './MapItemBase';
import { Role } from '../Role';
import GameConst, { BOOST_DESTORY_TIME, BOOST_TIME, BOOST_TYPE, FacilityAreaType } from '../../../common/GameConst';

import WindowManager from '../../../manager/WindowManager';
import { Global } from '../../../common/Global';
import AssetPool from '../../../component/AssetPool';
const { ccclass, property } = _decorator;

@ccclass('BoostItem')
export class BoostItem extends MapItemBase {
    initArea() {
        this.triggerAreaList.length = 0;
        this.triggerAreaList.push({ type: FacilityAreaType.BOOST_AREA, pos: this.node.worldPosition, dis: 0.5 })
    }

    onTriggerExit(role: Role, triggerType: number) {
    }
    start(): void {
        
    }

    onTriggerEnter(role: Role, triggerType: number) {
        if (triggerType != FacilityAreaType.BOOST_AREA) return;
        console.log("BOOST ENTER")
        WindowManager.Instance().open(GameConst.winPath.BoostWin, { type: this.type, node: this });
    }

    private Money: Node = null;
    private Gloves: Node = null;
    private Inlineskate_pink: Node = null;
    private Inlineskate_blue: Node = null;
    public type: BOOST_TYPE = BOOST_TYPE.BOOST_GLOVES
    setType(type: BOOST_TYPE) {
        this.type = type;
        this.Gloves.active = type == BOOST_TYPE.BOOST_GLOVES;
        this.Inlineskate_pink.active = type == BOOST_TYPE.BOOST_INLINESKATE_PINK;
        this.Inlineskate_blue.active = type == BOOST_TYPE.BOOST_INLINESKATE_BLUE;
        this.Money.active = type == BOOST_TYPE.MONEY;
        this.createTime = Date.now();
        this.node_180.active = type != BOOST_TYPE.MONEY;
        this.initArea();
        Global.game.map.addMapItem(this);
    }
    node_180: Node = null;

    private createTime: number = 0;
    root: Node = null;
    update(dt: number): void {
        if (Date.now() - this.createTime > BOOST_DESTORY_TIME * 1000) {
            Global.game.map.removeMapItem(this);
            this.node.removeFromParent()
            AssetPool.Instance().put(this.node);
            return;
        }


        this.root.eulerAngles = v3(0, this.root.eulerAngles.y + 100 * dt, 0);


        this.light.eulerAngles = v3(0, 0, this.light.eulerAngles.z + 100 * dt);
        this.light2.eulerAngles = v3(0, 0, this.light2.eulerAngles.z - 80 * dt);
    }

    private light: Node = null;
    private light2: Node = null;
}


