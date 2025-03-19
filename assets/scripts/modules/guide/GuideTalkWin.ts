import { _decorator, Component, Node, log, Tween, tween, v3 } from 'cc';
import BasePanel from '../../component/BasePanel';
const { ccclass, property } = _decorator;

@ccclass('GuideTalkWin')
export class GuideTalkWin extends BasePanel {
    start() {

    }

    onBtnClicked(e, name) {

    }
    onShow(data) {
        this.data=data
        let obj=this.GetGameObject('txt_talk')
        this.SetText('txt_talk', data)
        Tween.stopAllByTarget(obj)
        tween(obj).to(0.5,{scale:v3(1.1,1.1,1.1)}).to(0.5,{scale:v3(0.9,0.9,0.9)}).union().repeatForever().start()        
    }
}


