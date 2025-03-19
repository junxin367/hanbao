
export enum E_UILAYER {
    背景 = '背景',
    标题 = '标题',
    弹窗 = '弹窗',
    弹窗2 = '弹窗2',
    最顶层 = '最顶层',
}

export default class GameConst {
    //顾客最大数量
    static MAX_CUSTOMER: number = 10
    static MAX_CAR: number = 6
    static winPath =
        {
            GameWin: { name: 'GameWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.背景 },
            UpgradeWin: { name: 'UpgradeWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            BoostWin: { name: 'BoostWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            SpecialOrderWin: { name: 'SpecialOrderWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            GuideTalkWin: { name: 'GuideTalkWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗2 },

            // LoadingWin: { name: 'LoadingWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.背景 },
            // SkinWin: { name: "SkinWin", path: "ui/", bundle: "prefabs", layer: UILayer.弹窗 },
            // SettingWin: { name: "SettingWin", path: "ui/", bundle: "prefabs", layer: UILayer.弹窗 },
            // MartsWin: { name: "MartsWin", path: "ui/", bundle: "prefabs", layer: UILayer.弹窗 },
            // LuPinResult: { name: "LuPinResult", path: "ui/", bundle: "prefabs", layer: UILayer.弹窗 },
        }

    static EventType =
        {
            Remove: "Remove",
            UpdateHeadTip: "UpdateHeadTip",
            RemoveSleepState: "RemoveSleepState",//移除睡眠状态
        }
    static CONDITION_TYPE = {
        HAS_LITTER: 1,//是否有垃圾
        CAN_PACKAGE: 2,
        CAN_CASHIER: 3,
        CAN_DRIVE_CAR: 4,
    }
    static CUSTOME_TYPE =
        {
            Normal: 1,//打赏8-10
            Boss: 2,//打赏24-28
            Calling: 3,//打电话的人
        }

    static CAR_TYPE =
        {
            Normal: 1,//打赏400-500
            Supercar: 2,//打赏1000-2000
        }

}
//物品类型
export enum ItemType {
    Money = 1,
    Burger,
    Package,
    Litter,

}
//设施ID,配置表中的
export enum FacilityID {
    Gate = 1,
    Desk1 = 2,
    Burger_Machine1 = 3,
    CashierDesk = 4,
    Desk2 = 5,
    HrOffice = 6,
    UpgradeOffice = 7,
    DriveCarTable = 8,
    PackageTable = 9,
    Burger_Machine2 = 10,
    Desk3 = 11,
    Desk4 = 12,
    Desk5 = 13,
    Desk6 = 14,
    Robot = 15,
    Desk7 = 16,
    Desk8,
    Desk9,
    Desk10,
    Desk11,
    Desk12,
    Desk13
}
//设施类型
export enum FacilityType {
    BURGER_MACHINE = 1,
    COUNTER,//收银台
    PACKAGING_TABLE,//打包台
    DESK,//桌子
    DRIVE_THRU,//得来速
}
//碰撞区域类型
export enum FacilityAreaType {
    DEFAULT = 0,
    UNLOCK = 1,
    UPGRADE,
    PRODUCTION,//生产区域    
    COUNTER_SEND,//柜台发食物区域
    COUNTER_FOOD_PLACEMENT,//柜台放置食物
    COUNTER_WORKER_BUY,//柜台员工购买
    MONEY_COLLECTION,//主角收钱区域
    DESK_LITTER_POS,//桌子纸团区域
    PACKAGE_FOOD_PLACEMENT,//打包区食物放置
    PACKAGE_BOX,//打包盒子搬运区域
    DRIVE_THRU_WORKER_BUY,//得来速工人购买
    DRIVE_THRU_PLACEMENT,//得来速食物放置
    DRIVE_THRU_SEND,//得来速发放食物位置
    TRASHBOX,//垃圾桶
    UPGRADE_OFFICE,//升级办公室
    BOOST_AREA,//地图上的道具
}


export enum BOOST_TYPE {
    BOOST_GLOVES = 0,
    BOOST_INLINESKATE_BLUE = 1,
    BOOST_INLINESKATE_PINK = 2,
    CLEAN_BOT = 3,
    MONEY = 4,
    PINGHENGCHE = 5
}


export let BOOST_TIME = 3 * 60 //道具持续时间 s
export let BOOST_DESTORY_TIME = 50 //道具不捡销毁时间 s


export enum E_UPGRADE_TYPE {
    PLAYER_CARRY = 5,//主角携带数量
    PLAYER_SPEED = 4,//主角速度
    PLAYER_LIRUN = 6,//主角利润

    STAFF_CARRY = 2,//员工携带数量
    STAFF_SPEED = 1,//员工速度
    STAFF_COUNT = 3,//员工数量
}