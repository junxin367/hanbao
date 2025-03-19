import { DefaultTemplete, LocalVersion, NetControlUrl, NetControlUrlTT } from "./LocalTemplete";
import NetTool from "./NetTool";

export default class NetControl {

    public static query: any = {};

    private static offServTimestap = 0;

    //当前时间戳  秒
    public static NowSecond() {
        return Math.floor(Date.now() / 1000) + this.offServTimestap;
    }

    //初始化
    public static init() {
        this.load();
    }

    public static reload() {
        this.load();
    }



    //获取广告数据
    public static getAdsData(key: string, defaultvalue: any = null) {
        return this.getPlatData("ads", {})[key] || defaultvalue;
    }

    //获取互导列表
    public static getGameList() {
        let list = this.getPlatData("gamelist", [])
        //过滤掉当前游戏
        let len = list.length;
        for (let i = 0; i < len; i += 1) {
            if (list[i].appid == this.getPlatData("appid", "")) {
                list.splice(i, 1);
                break;
            }
        }
        list = list.sort((a, b) => {
            return b.weight - a.weight;
        })
        return list
        // return JSON.parse(JSON.stringify(list));
    }

    //每次从游戏列表循环取出一个
    private static gameIndex = 0;
    public static getGameItem() {
        let list = this.getGameList();
        let len = list.length;
        if (len == 0) {
            return null;
        }
        return list[this.gameIndex++ % len];
    }

    //随机分享内容
    public static getShareData() {
        let share_title = this.getPlatData("share_title", []);
        let share_content = this.getPlatData("share_content", []);
        let share_urls = this.getPlatData("share_urls", []);

        let out = {
            content: share_content[Math.floor(Math.random() * share_content.length)],
            title: share_title[Math.floor(Math.random() * share_title.length)],
            url: share_urls[Math.floor(Math.random() * share_urls.length)],
        }
        return out
    }


    public static getPlatData(key: string, defaultvalue: any = null) {
        return this.data[key] || defaultvalue;
    }

    //获取控制数据
    public static getCtrData(key: string) {
        return this.data["ctrl"][key] || {}
    }

    /** return true 是屏蔽城市 */
    static isOffCitys(): boolean {
        if (!this.loc)
            return false;
        var len: number = this.loc.length;
        var list: any = this.getPlatData("citys", []);
        for (var i = 0; i < len; i += 1) {
            if (list.indexOf(this.loc[i]) >= 0) {
                return true;
            }
        }
        return false;
    }

    //是否审核版本
    static isContrilVersion(): boolean {
        var version: string = this.getPlatData("version", "");
        if (version == "") {
            return false;
        }
        if (LocalVersion == version) {
            console.log("是审核版本");
            return true;
        }
        return false;
    }



    private static data = DefaultTemplete;
    private static loc: string[] = [];

    private static load() {
        return new Promise((resolve, reject) => {
            NetTool.get(window['tt'] ? NetControlUrlTT : NetControlUrl, null, (ret) => {
                this.copyData(ret);
                resolve(null);
            })
        })
    }

    private static copyData(data: any) {
        for (const key in data) {
            this.data[key] = data[key];
        }
    }




}



