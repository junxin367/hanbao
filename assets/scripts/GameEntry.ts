import { _decorator, assetManager, Component, instantiate, Node, Prefab } from 'cc';
import GameData from './GameData';
import ResHelper from './utils/ResHelper';
const { ccclass, property } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
    start() {




        GameData.init(() => {
            console.log("配置加载完毕")





        })
    }

    update(deltaTime: number) {

    }
}


