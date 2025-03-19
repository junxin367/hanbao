{0}

import CfgParser from './CfgParser';

export default class {1} {{
    public static dataRaw = {2}
    public static dataMap = {{}};

    public static init() {{
        for(let dbName in this.dataRaw) {{
            let jsonData = this.dataRaw[dbName];
            this.dataMap[dbName] = CfgParser.parseJsonData(jsonData, jsonData.rule);
        }}
        CfgParser.parseRelation(this.dataMap);
    }}

    {3}
}}