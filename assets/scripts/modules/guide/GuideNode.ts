import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GuideNode')
export class GuideNode extends Component {
    @property
    gName:string=""
    start() {

    }
}


