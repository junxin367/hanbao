
import GameConst, { BOOST_TYPE, E_UPGRADE_TYPE, FacilityAreaType, FacilityID, FacilityType } from "../common/GameConst";
import GameData from "../GameData";
import { GameManager } from "../modules/game/GameManager";
import ModelBase, { save } from "./ModelBase";

export default class GameModel extends ModelBase {
    @save ProgressIds: number[] = [];
    @save MoneyPutInfo: any = {};   //解锁的投币信息
    @save mapItemLv: { [key: string | number]: number } = {};               //场景中设备等级

    @save
    private _money: number = 0;
    public get money(): number {
        return this._money;
    }
    public set money(value: number) {
        this._money = Math.floor(value);
    }

    deskInfo: { [key: number]: { dirty: boolean, seats: number[] } } = {};  //桌子每个座位是否有人
    @save upgradeInfo: { [key: number]: number } = {};                      //办公室升级信息  id-lv  默认0级

    @save moneyStack: any = {}//存储场景中的money，按照设施type存
    @save itemStack:any={}////存储场景中的money，按照设施type存
    deliveryDriverInfo: { time: number, type: number, put: number, need: number } = null;          //外卖员信息

    @save guideID: number = 1

    //检测是否有有收银员，没有就主角充当收银员
    checkHasCashier() {
        return false
    }

    //获取当前1次广告对应钞票
    getCurAdMoney() {
        return Math.min(this.ProgressIds.length * 50, 500)
    }

    getBergerPrice() {
        return 8
    }

    //当前所在场景
    @save sceneId: number = 1;

    //boost
    @save boost: { [type: number]: number } = {};

    //是否有滑轮
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

    //是否有手套
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
    //获取汉堡机升级后的属性 最大产量 速度
    getBurgerMachineInfo(lv: number): { lv: number, max: number, speed: number } {
        return { lv: lv, max: 6 + (lv - 1) * 2, speed: 2.6 - (lv - 1) * 0.2 }
    }
    //获取收银台员工属性(发送食物速度)
    getCashierCounterProp() {
        let lv = this.getFacilityLv(FacilityID.CashierDesk)
        return 1.8 - lv * 0.2
    }
    //获取设施等级
    getFacilityLv(id: number) {
        return this.mapItemLv[id + '_up'] || 0
    }
    //获取打包台员工属性(打包速度)
    getPackageCounterProp() {
        let lv = this.getFacilityLv(FacilityID.PackageTable)
        return 2 - lv * 0.2
    }
    //获取打包台员工属性(发送食物速度)
    getDriveCarCounterProp() {
        let lv = this.getFacilityLv(FacilityID.DriveCarTable)
        return 1.8 - lv * 0.2
    }
    //获取玩家移动速度倍数
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
    //获取玩家收益倍数
    getPlayerProfitRate() {
        let s = [1.5, 2, 3, 4]
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.PLAYER_LIRUN] || 0
        if (lv == 0) return 1
        return s[lv - 1]
    }
    //获取员工移动速度
    getStaffMoveSpeed() {
        let s = [1.8, 2.2, 2.4, 3]
        let lv = this.upgradeInfo[E_UPGRADE_TYPE.STAFF_SPEED] || 0
        if (lv == 0) return 1.6
        return s[lv - 1]
    }
}