
import { sys } from "cc";

import GameModel from "./GameModel";

const localDataKey = 'bugerGameox'
export default class Model {
    //暂时就一个数据模型
    public static game: GameModel = new GameModel();

    public static save(bRemote: boolean = false) {
        var obj = {}
        obj['game'] = Model.game.getData() 

        //  obj['level'] = Model.level.getUploadData()

        Model.savedata(obj, bRemote)
    }

    public static getGameData() {
        let strdata = sys.localStorage.getItem(localDataKey);
        return strdata;
    }

    public static loadData() {
        var localdata = sys.localStorage.getItem(localDataKey);
        if (localdata) {
            localdata = JSON.parse(localdata);
            Model.game.setData(localdata['game'])
            console.log(localdata)

        }
        else {
            //todo
            // //没有档案重置下音乐开关
            // sys.localStorage.setItem("bgmVolume", AudioMgr.DEFAULT_VOLUME);
            // sys.localStorage.setItem("sfxVolume", AudioMgr.DEFAULT_VOLUME);
            // sys.localStorage.setItem("vibrate", 1);

            // AudioMgr.Instance().sfxVolume = AudioMgr.DEFAULT_VOLUME;
            // AudioMgr.Instance().bgmVolume = AudioMgr.DEFAULT_VOLUME;
            // AudioMgr.Instance().vibrate = 1;

        }
    }

    //本地存数据
    private static savedata(data, bRemote: boolean = false) {
        var strdata = JSON.stringify(data);
        sys.localStorage.setItem(localDataKey, strdata);
        data.game = {}
    }
}