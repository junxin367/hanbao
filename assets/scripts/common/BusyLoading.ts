import { _decorator, Tween, tween, Node, UIOpacity } from "cc";
import Component from "../component/Component";

const { ccclass, property } = _decorator;

@ccclass
export default class BusyLoading extends Component {
    @property(Node)
    node_circle: Node = null
    onEnable(): void {

        let op = this.node.getComponent(UIOpacity);
        op.opacity = 0
        tween(op).to(1, { opacity: 255 }).start()

        Tween.stopAllByTarget(this.node_circle)
        tween(this.node_circle).by(1, { angle: -360 }).repeatForever().start()
    }
}