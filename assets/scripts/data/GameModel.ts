
import GameConst, { BOOST_TYPE, E_UPGRADE_TYPE, FacilityAreaType, FacilityID, FacilityType } from "../common/GameConst";
import GameData from "../GameData";
import { GameManager } from "../modules/game/GameManager";
import ModelBase, { save } from "./ModelBase";

export default class GameModel extends ModelBase {
    @save ProgressIds: number[] = [];
    @save MoneyPutInfo: any = {};   
    @save mapItemLv: { [key: string | number]: number } = {};               

    @save
    private _money: number = 0;
    public get money(): number {
        return this._money;
    }
    public set money(value: number) {
        this._money = Math.floor(value);
    }

    deskInfo: { [key: number]: { dirty: boolean, seats: number[] } } = {};  
    @save upgradeInfo: { [key: number]: number } = {};                      

    @save moneyStack: any = {}
    @save itemStack:any={}
    deliveryDriverInfo: { time: number, type: number, put: number, need: number } = null;          

    @save guideID: number = 1


    checkHasCashier() {
        return false
    }


    getCurAdMoney() {
        return Math.min(this.ProgressIds.length * 50, 500)
    }

    getBergerPrice() {
        return 8
    }


    @save sceneId: number = 1;


    @save boost: { [type: number]: number } = {};


    public hasSkate() {
        for (const key in this.boost) {
            let lefttime = this.boost[key];
            if (lefttime > 0 && (Number(key) == BOOST_TYPE.BOOST_INLINESKATE_BLUE ||
                Number(key) == BOOST_TYPE.BOOST_INLINESKATE_PINK))
                return true
        }
        return false;
    }

    public hasPingHengChe() {
        for (const key in this.boost) {
            let lefttime = this.boost[key];
            if (lefttime > 0 && Number(key) == BOOST_TYPE.PINGHENGCHE)
                return true
        }
        return false;
    }


    public hasGloves() {
        for (const key in this.boost) {
            let lefttime = this.boost[key];
            if (lefttime > 0 && Number(key) == BOOST_TYPE.BOOST_GLOVES)
                return true
        }
        return false;
    }
    getPlayerCarryMax() {
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.PLAYER_CARRY] || 0;
        let index = lv - 1;
        let boost_add = this.hasGloves() ? 10 : 0;
        return 2 + (index >= 0 ? GameData.getUpgradeItem(E_UPGRADE_TYPE.PLAYER_CARRY).Value[index] : 0) + boost_add;
    }
    getStaffCarryMax() {
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.STAFF_CARRY] || 0;
        let index = lv - 1;
        return 2 + (index >= 0 ? GameData.getUpgradeItem(E_UPGRADE_TYPE.STAFF_CARRY).Value[index] : 0);
    }
    offsetMoneyStack(type: FacilityType, value: number) {
        if (!this.moneyStack[type])
            this.moneyStack[type] = 0
        this.moneyStack[type] += value;
    }
    offsetItemStack(type: FacilityAreaType, value: number) {
        if (!this.itemStack[type])
            this.itemStack[type] = 0
        this.itemStack[type] += value;
    }

    getBurgerMachineInfo(lv: number): { lv: number, max: number, speed: number } {
        return { lv: lv, max: 6 + (lv - 1) * 2, speed: 2.6 - (lv - 1) * 0.2 }
    }

    getCashierCounterProp() {
        let lv = this.getFacilityLv(FacilityID.CashierDesk)
        return 1.8 - lv * 0.2
    }

    getFacilityLv(id: number) {
        return this.mapItemLv[id + '_up'] || 0
    }

    getPackageCounterProp() {
        let lv = this.getFacilityLv(FacilityID.PackageTable)
        return 2 - lv * 0.2
    }

    getDriveCarCounterProp() {
        let lv = this.getFacilityLv(FacilityID.DriveCarTable)
        return 1.8 - lv * 0.2
    }

    getPlayerMoveSpeedRate() {
        let s = [3, 4, 5, 6]
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.PLAYER_SPEED] || 1;
        let rate = s[lv - 1]
        if (this.hasSkate())
            rate = 7
        if (this.hasPingHengChe())
            rate = 6
        return rate
    }

    getPlayerProfitRate() {
        let s = [1.5, 2, 3, 4]
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.PLAYER_LIRUN] || 0
        if (lv == 0) return 1
        return s[lv - 1]
    }

    getStaffMoveSpeed() {
        let s = [1.8, 2.2, 2.4, 3]
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.STAFF_SPEED] || 0
        if (lv == 0) return 1.6
        return s[lv - 1]
    }
}