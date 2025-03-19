import { instantiate, isValid, Label, Node, Prefab, UIOpacity, warn } from "cc";
import ResHelper from "../utils/ResHelper";
import { E_UILAYER } from "../common/GameConst";
import WindowManager from "./WindowManager";

export enum BUSY_TYPE {
    NET,//网络
    RES//加载资源
}
export default class BusyLoadingManager {
    private static instance = null;
    private busyMap: Map<BUSY_TYPE, number> = new Map();
    private loadingUI: Node;
    private timerID: number = null
    private delay: number = 300//延迟显示
    constructor() {

    }
    public static get ins(): BusyLoadingManager {
        if (BusyLoadingManager.instance == null) {
            BusyLoadingManager.instance = new BusyLoadingManager();
        }
        return BusyLoadingManager.instance;
    }
    public init() {
        ResHelper.loadRes('BusyLoading', 'prefabs', Prefab, (err, res: Prefab) => {
            this.loadingUI = instantiate(res)
            this.loadingUI.setSiblingIndex(999)
        })
    }


    public addBusy(type: BUSY_TYPE, lable: string = "") {
        if (this.loadingUI == null) {
            this.init()
            return
        }

        if (lable == "") {
            if (type == BUSY_TYPE.NET) {
                lable = "请稍后...";
            }
            else {
                lable = "正在加载资源...";
            }
        }
        this.loadingUI.getChildByName("lbl_text").getComponent(Label).string = lable;

        let count = this.busyMap.get(type)
        if (count)
            this.busyMap.set(type, count + 1)
        else
            this.busyMap.set(type, 1)
        this.checkBusy()

    }
    public removeBusy(type: BUSY_TYPE) {
        let count = this.busyMap.get(type)
        if (count)
            this.busyMap.set(type, count - 1)
        else
            warn('error', type)
        this.checkBusy()
    }
    public checkBusy() {
        if (this.loadingUI == null || !isValid(this.loadingUI)) {
            this.init()
            return
        }
        var count = this.getBusyCount()
        if (count > 0) {
            let self = this;
            let onTimerEnd = () => {
                let curCnt = this.getBusyCount()
                if (curCnt > 0) {
                    self.updateTips();
                } else {
                    warn('error 0')
                }
                this.timerID = null;
            }
            if (this.timerID) {
                clearTimeout(this.timerID);
                this.timerID = setTimeout(onTimerEnd, this.delay);
            } else {
                if (this.loadingUI.parent) {
                    this.updateTips();
                } else {
                    this.loadingUI.parent = WindowManager.Instance().getLayer(E_UILAYER.最顶层);
                    this.timerID = setTimeout(onTimerEnd, this.delay);
                }
            }
        } else {
            if (this.timerID) {
                clearTimeout(this.timerID);
                this.timerID = 0;
            }
            if (this.loadingUI.parent) {
                this.loadingUI.removeFromParent();
            }
        }
    }
    private updateTips() {

    }
    private getBusyCount() {
        let c = 0;
        this.busyMap.forEach((v, k) => {
            c += v;
        })
        return c;
    }
}