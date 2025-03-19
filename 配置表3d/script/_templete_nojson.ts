{0}

import CfgParser from './CfgParser';

export default class {1} {{
    public static dataRaw = {{}};
    public static dataMap = {{}};
    public static onComplete:Function = null;
    public static init(onComplete?:Function,pathPre?:string) {{
        this.onComplete = onComplete;
        if(!pathPre) pathPre = "";
        let file = "{2}";
        file = file.replace(".json","")
        CfgParser.loadJson4Cocos(pathPre + file, this.onJsonLoad.bind(this))
    }}

    public static onJsonLoad(json) {{
        this.dataRaw = json;

        for(let dbName in this.dataRaw) {{
            let jsonData = this.dataRaw[dbName];
            this.dataMap[dbName] = CfgParser.parseJsonData(jsonData, jsonData.rule);
        }}

        CfgParser.parseRelation(this.dataMap);
        if(this.onComplete) this.onComplete();
    }}

    {3}
}}