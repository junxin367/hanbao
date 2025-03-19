import { _decorator } from "cc";
import Component from "./Component";
import { E_UILAYER } from "../common/GameConst";
import WindowManager from "../manager/WindowManager";

const { ccclass, property } = _decorator;

@ccclass('BasePanel')
export default abstract class BasePanel extends Component {
    abstract onBtnClicked(e, name: string);
    winInfo: { name: string, path: string, bundle: string, layer?: E_UILAYER }
    data: any

    onCreate(data) {
        this.data = data
    }

    onShow(data) {

    }

    onHide() {

    }

    close(destory: boolean = true) {
        WindowManager.Instance().removeWindow(this.winInfo, destory);
    }
    //销毁之前处理一些回收
    onRecycle() {

    }
}