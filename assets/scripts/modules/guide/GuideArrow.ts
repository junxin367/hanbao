import { _decorator, Component, Node, tween, v3, MeshRenderer, v4 } from 'cc';
import BaseComponent from '../../component/Component';
const { ccclass, property } = _decorator;

@ccclass('GuideArrow')
export class GuideArrow extends BaseComponent {
    start() {

    }

    onEnable() {
        let mat = this.GetGameObject('body').getComponent(MeshRenderer).material
        tween(this.GetGameObject('arrow')).to(0.5, { position: v3(0, 3, 0) }).to(0.5, { position: v3(0, 2, 0) }).union().repeatForever().start()
    }
    setRed() {
        let mat = this.GetGameObject('body').getComponent(MeshRenderer).material
        mat.setProperty('albedo', v4(1, 0, 0, 1))
    }
}


