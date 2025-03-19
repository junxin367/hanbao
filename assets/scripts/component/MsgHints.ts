import { Component, instantiate, Label, Node, Prefab, tween, v3, view, _decorator } from "cc";
import ResHelper from "../utils/ResHelper";
import { E_UILAYER } from "../common/GameConst";
import WindowManager from "../manager/WindowManager";

const { ccclass, property } = _decorator;

@ccclass
export default class MsgHints extends Component {
    setMsg(str: string) {
        this.node.getComponentInChildren(Label).string = str;
        this.node.setScale(v3(0, 0, 0));

        this.node.setPosition(0, view.getVisibleSize().height * 0.3);
        tween(this.node).to(0.1, { scale: v3(1.1, 1.1, 1) }).to(0.1, { scale: v3(0.9, 0.9, 1) }).to(0.1, { scale: v3(1, 1, 1) }).delay(0.5).by(0.5, { position: v3(0, 100) }).removeSelf().start();
    }

    public static show(msg: string) {
        ResHelper.loadRes("ui/MsgHints", "prefabs", Prefab, (err: Error, res: Prefab) => {
            let win: Node = instantiate(res)
            win.parent = WindowManager.Instance().getLayer(E_UILAYER.最顶层);
            win.getComponent(MsgHints).setMsg(msg);
        });
    }
}