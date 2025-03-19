import { _decorator, assetManager, Component, instantiate, Node, Prefab } from 'cc';
import GameData from './GameData';
import ResHelper from './utils/ResHelper';
const { ccclass, property } = _decorator;
//游戏入口
@ccclass('GameEntry')
export class GameEntry extends Component {
    start() {
        // await Config.load()
        //  Model.loadData()      
        // WindowManager.Instance().register(this.ui_container)
        //WindowManager.Instance().open(GameConst.winPath.MainWin)
        GameData.init(() => {
            console.log("配置加载完毕")

            // ResHelper.loadResSync("stage/stage01_cocos", "prefabs", Prefab).then((prefab: Prefab) => {
            //     let node = instantiate(prefab)
            //     node.parent = this.node;
            // })
        })
    }

    update(deltaTime: number) {

    }
}


