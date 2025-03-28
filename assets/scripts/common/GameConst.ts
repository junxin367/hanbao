
export enum E_UILAYER {
    背景 = '背景',
    标题 = '标题',
    弹窗 = '弹窗',
    弹窗2 = '弹窗2',
    最顶层 = '最顶层',
}

export default class GameConst {

    static MAX_CUSTOMER: number = 10
    static MAX_CAR: number = 6
    static winPath =
        {
            GameWin: { name: 'GameWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.背景 },
            UpgradeWin: { name: 'UpgradeWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            BoostWin: { name: 'BoostWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            SpecialOrderWin: { name: 'SpecialOrderWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗 },
            GuideTalkWin: { name: 'GuideTalkWin', path: 'ui/', bundle: 'prefabs', layer: E_UILAYER.弹窗2 },






        }

    static EventType =
        {
            Remove: "Remove",
            UpdateHeadTip: "UpdateHeadTip",
            RemoveSleepState: "RemoveSleepState",
        }
    static CONDITION_TYPE = {
        HAS_LITTER: 1,
        CAN_PACKAGE: 2,
        CAN_CASHIER: 3,
        CAN_DRIVE_CAR: 4,
    }
    static CUSTOME_TYPE =
        {
            Normal: 1,
            Boss: 2,
            Calling: 3,
        }

    static CAR_TYPE =
        {
            Normal: 1,
            Supercar: 2,
        }

}

export enum ItemType {
    Money = 1,
    Burger,
    Package,
    Litter,

}

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

export enum FacilityType {
    BURGER_MACHINE = 1,
    COUNTER,
    PACKAGING_TABLE,
    DESK,
    DRIVE_THRU,
}

export enum FacilityAreaType {
    DEFAULT = 0,
    UNLOCK = 1,
    UPGRADE,
    PRODUCTION,
    COUNTER_SEND,
    COUNTER_FOOD_PLACEMENT,
    COUNTER_WORKER_BUY,
    MONEY_COLLECTION,
    DESK_LITTER_POS,
    PACKAGE_FOOD_PLACEMENT,
    PACKAGE_BOX,
    DRIVE_THRU_WORKER_BUY,
    DRIVE_THRU_PLACEMENT,
    DRIVE_THRU_SEND,
    TRASHBOX,
    UPGRADE_OFFICE,
    BOOST_AREA,
}


export enum BOOST_TYPE {
    BOOST_GLOVES = 0,
    BOOST_INLINESKATE_BLUE = 1,
    BOOST_INLINESKATE_PINK = 2,
    CLEAN_BOT = 3,
    MONEY = 4,
    PINGHENGCHE = 5
}


export let BOOST_TIME = 3 * 60 
export let BOOST_DESTORY_TIME = 50 


export enum E_UPGRADE_TYPE {
    PLAYER_CARRY = 5,
    PLAYER_SPEED = 4,
    PLAYER_LIRUN = 6,

    STAFF_CARRY = 2,
    STAFF_SPEED = 1,
    STAFF_COUNT = 3,
}