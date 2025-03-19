import { JsonAsset, resources } from "cc";
export default class CfgParser {
    static relationQueue: Array<any> = [];

    static loadJson4Cocos(path: string, func: Function) {
        resources.load(path, JsonAsset, (err, ret: JsonAsset) => {
            if (!err) {
                func(ret.json);
            }
        })
    }

    static parseTypeValue(typeOrigin: string, data, itemData?, field?) {
        let typeOriginSplit = typeOrigin.split(":");
        let type = typeOriginSplit[0];
        let typeSub = "";
        if (typeOriginSplit.length > 1) {
            typeSub = typeOriginSplit[1];
        }

        let value = null;

        if (typeSub == "A") {
            value = [];
            let dataArr = data.toString().split(";");
            switch (type) {
                case 'B':
                    for (let subData of dataArr) {
                        if (typeof (subData) == "number") {
                            value = subData == 1
                        } else {
                            value = (subData.toLowerCase() == "true")
                        }
                    }
                    break;
                case 'I':
                    for (let subData of dataArr) {
                        value.push(Number(subData));
                    }
                    break;
                case 'S':
                    for (let subData of dataArr) {
                        value.push(subData);
                    }
                    break;
                case 'J':
                    for (let subData of dataArr) {
                        value.push(JSON.parse(subData));
                    }
                    break;
                default:
                    if (data === "") return null;
                    for (let subData of dataArr) {
                        let queueItem = {
                            __item__: value,
                            __field__: field,
                            __type__: type,
                            __data__: subData,
                            __type_sub__: typeSub,
                        }
                        this.relationQueue.push(queueItem);
                    }
                    break;
            }
        } else {
            switch (type) {
                case 'B':
                    if (typeof (data) == "number") {
                        value = data == 1
                    } else {
                        value = (data.toLowerCase() == "true")
                    }
                    break;
                case 'I':
                    value = Number(data);
                    break;
                case 'S':
                    value = data;
                    break;
                case 'T':
                    value = JSON.parse(data)
                    break;
                default:
                    if (data === "") return null;
                    value = {
                        __item__: itemData,
                        __field__: field,
                        __type__: type,
                        __data__: data,
                    }
                    this.relationQueue.push(value);
                    break;
            }
        }

        if (itemData && field)
            itemData[field] = value;

        return value;
    }

    static parseRelation(dataMap) {
        for (let item of this.relationQueue) {
            if (item.__item__ && item.__data__ != "") {
                if (item.__type_sub__ == "A") {
                    item.__item__.push(dataMap[item.__type__][item.__data__]);
                } else {
                    item.__item__[item.__field__] = dataMap[item.__type__][item.__data__];
                }
            }
        }
        this.relationQueue.length = 0;
    }

    static putItemInData(item, data, rules, fields) {
        switch (rules) {
            case 'm': 
                var key = item[fields[0]];
                if (data[key]) {
                    console.log("putItemInData[m] Error: duplicate key", key);
                }

                data[key] = item;

                return;
            case 'mm': 
                var key1 = item[fields[0]];
                var key2 = item[fields[1]];

                var data1 = data[key1];
                if (data1 == null) {
                    data1 = {};
                    data[key1] = data1
                }

                if (data1[key2]) {
                    console.log("putItemInData[mm] Error: duplicate key", key1, key2);
                }

                data1[key2] = item;

                return;
            case 'kv':
                var key = item[fields[0]];
                var type = item[fields[1]];
                var value = item[fields[2]];

                data[key] = this.parseTypeValue(type, value);

                return;
            default:
                console.error("putItemInData: not found rule", rules);
                return;
        }
    }

    static parseJsonData(jsonData, rules) {
        var types = jsonData.types;
        var fields = jsonData.fields;
        var values = jsonData.values;

        var data = {};

        for (var j = 0; j < values.length; j++) {
            var value = values[j];
            var itemData = {};

            for (var i = 0; i < types.length; i++) {
                var type = types[i];
                var field = fields[i];
                var item = value[i];

                this.parseTypeValue(type, item, itemData, field);
            }

            this.putItemInData(itemData, data, rules, fields);
        }

        return data;
    }

    static parseJsonString(jsonStr, rules) {
        return this.parseJsonData(JSON.parse(jsonStr), rules);
    }

}