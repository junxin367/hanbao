export interface ProgressConfig{Id:number;Scene:number;Name:string;Type:number;NodeName:string;param:number;ColliderNodeName:string;PreLimit:number;MoneyCost:number;UpgradeCost:Array<number>;}
export interface Upgrade{Id:number;Sence:number;Type:number;Name:string;Icon:string;Cost:Array<number>;Value:Array<number>;}


import CfgParser from './CfgParser';

export default class GameData {
    public static dataRaw = {};
    public static dataMap = {};
    public static onComplete:Function = null;
    public static init(onComplete?:Function,pathPre?:string) {
        this.onComplete = onComplete;
        if(!pathPre) pathPre = "";
        let file = "/game_data.json";
        file = file.replace(".json","")
        CfgParser.loadJson4Cocos(pathPre + file, this.onJsonLoad.bind(this))
    }

    public static onJsonLoad(json) {
        this.dataRaw = json;

        for(let dbName in this.dataRaw) {
            let jsonData = this.dataRaw[dbName];
            this.dataMap[dbName] = CfgParser.parseJsonData(jsonData, jsonData.rule);
        }

        CfgParser.parseRelation(this.dataMap);
        if(this.onComplete) this.onComplete();
    }

    static getProgressConfigItem( key1 ):ProgressConfig{ return this.dataMap['ProgressConfig'][key1]; }
	static getProgressConfig():Map<string, ProgressConfig>{ return this.dataMap['ProgressConfig']; }
	static getUpgradeItem( key1 ):Upgrade{ return this.dataMap['Upgrade'][key1]; }
	static getUpgrade():Map<string, Upgrade>{ return this.dataMap['Upgrade']; }
	
}