
import { sys } from "cc";

import GameModel from "./GameModel";

const localDataKey = 'bugerGameox'
export default class Model {

    public static game: GameModel = new GameModel();

    public static save(bRemote: boolean = false) {
        var obj = {}
        obj['game'] = Model.game.getData() 



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










        }
    }


    private static savedata(data, bRemote: boolean = false) {
        var strdata = JSON.stringify(data);
        sys.localStorage.setItem(localDataKey, strdata);
        data.game = {}
    }
}