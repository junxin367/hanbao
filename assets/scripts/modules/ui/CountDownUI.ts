import { _decorator, Component, Node, Sprite, Tween, tween } from 'cc';
import BaseComponent from '../../component/Component';
const { ccclass, property } = _decorator;

@ccclass('CountDownUI')
export class CountDownUI extends BaseComponent {
    sp_bar: Sprite
    start() {

    }

    update(deltaTime: number) {

    }
    play(callback: Function) {
        Tween.stopAllByTarget(this.sp_bar)
        this.sp_bar.fillRange = 0
        tween(this.sp_bar).to(2.5, { fillRange: 1 }).call(() => {
            callback()
        }).start()
    }
    stop()
    {
        Tween.stopAllByTarget(this.sp_bar)
        this.sp_bar.fillRange = 0
    }
}


