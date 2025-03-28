import { assetManager, builtinResMgr, log, Sprite, SpriteFrame, sys, Tween, tween, Vec3 } from "cc";




export default class Utils {

    static lerp(a: number, b: number, r: number): number {
        return a + (b - a) * r;
    }

    static clampf(value: number, min: number, max: number): number {
        if (min > max) {
            var temp = min;
            min = max;
            max = temp;
        };
        return value < min ? min : value < max ? value : max;
    }

    public static randomItem(array: Array<any>) {
        if (array && array.length > 0) {
            return array[this.getRandomInt(0, array.length - 1)];
        } else {
            return null;
        }
    }

    public static objectToArray<T>(srcObj: { [key: string]: any }) {
        let resultArr: T[] = [];
        for (let key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }
            resultArr.push(srcObj[key]);
        }
        return resultArr;
    }


    public static IsToday(time: number): boolean {
        var date = new Date(time);
        var dateNow = new Date();
        let bSameDay = false;

        if (date.getFullYear() == dateNow.getFullYear() &&
            date.getMonth() == dateNow.getMonth() &&
            date.getDate() == dateNow.getDate()
        ) {
            bSameDay = true;
        }
        return bSameDay;
    }


    public static getRandom(lower, upper): number {
        return Math.random() * (upper - lower) + lower;
    };

    public static getRandomInt(lower, upper): number {
        return Math.floor(Math.random() * (upper - lower)) + lower;
    };



    static showTip(value: string) {
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            const wx = window["wx"] || window["tt"];
            wx.showToast({ title: value, icon: 'none', duration: 1500 })
        }
    }

    public static formatSecond(second: number) {
        second = Math.floor(second);
        if (second < 0) second = 0;
        var d = Math.floor(second / 3600 / 24);
        second -= d * 3600 * 24;
        var h = Math.floor(second / 3600);
        second -= h * 3600;
        var m = Math.floor(second / 60);
        second -= m * 60;
        var front = "00";
        if (h > 9) {
            front = "" + h;
        } else {
            front = "0" + h;
        }
        var mid = "00";
        if (m > 9) {
            mid = "" + m;
        } else {
            mid = "0" + m;
        }
        var back = "00";
        if (second > 9) {
            back = "" + second;
        } else {
            back = "0" + second;
        }

        if (d > 0) {
            return d + "天" + h + "时" + m + "分";
        }
        else {
            var longTime = h > 0;
            if (longTime) {
                return front + ":" + mid;
            } else {
                return mid + ":" + back;
            }
        }
    }

    public static weight(v: number[]): number {
        var mTotalWeight = 0;
        for (var i = 0; i < v.length; ++i) {
            mTotalWeight += v[i];
        }
        if (mTotalWeight <= 0) return -1;
        var randnum = Math.round(Math.random() * Number.MAX_VALUE) % mTotalWeight;
        for (var i = 0; i < v.length; ++i) {
            if (randnum < v[i]) {
                return i;
            }
            else {
                randnum -= v[i];
            }
        }
        return -1;
    }

    public static shuffle(arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            let rIndex = Math.floor(Math.random() * (i + 1));
            let temp = arr[rIndex];
            arr[rIndex] = arr[i];
            arr[i] = temp;
        }
        return arr;
    }

    static setGray(icon: Sprite, isGray: boolean) {
        if (isGray) {
            icon.setMaterial(builtinResMgr.get('2d-gray-sprite'), 0);
        } else {
            icon.setMaterial(builtinResMgr.get('2d-sprite'), 0);
        }
    }

    static setSpriteFrame(sp: Sprite, path: string, bundle: string = 'resources', callback = null): void {
        let loader = assetManager.getBundle(bundle)
        loader.load(path, SpriteFrame, (error, assets: SpriteFrame) => {
            if (error) {
                log('error', path)
                return
            }
            sp.spriteFrame = assets
            callback && callback()
        })
    }

    public static randomArray(arr: number[]) {
        let newArr = []
        let count = arr.length
        for (let i = 0; i < count; i++) {
            let rnd = Math.floor(Math.random() * arr.length)
            newArr.push(arr[rnd])
            arr.splice(rnd, 1)
        }
        return newArr
    }


    public static GetNearstAxisXZDis(a: Vec3, b: Vec3) {
        return Math.min(Math.abs(a.x - b.x), Math.abs(a.z - b.z));
    }
    /**
     * @desc 三阶阶贝塞尔
     * @param {number} duration 归一量百分比
     * @param {Vec3} p1 起点坐标
     * @param {Vec3} cp 控制点
     * @param {Vec3} p2 终点坐标
     * @param {object} opts 
     * @returns {any}
     */
    public static bezierTo(target: any, duration: number, p1: Vec3, cp: Vec3, p2: Vec3, opts?: any): Tween<any> {
        opts = opts || Object.create(null);
        let twoBezier = (t: number, p1: Vec3, cp: Vec3, p2: Vec3) => {
            let x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            let y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            let z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
            return new Vec3(x, y, z);
        };
        opts.onUpdate = (_arg: Vec3, ratio: number) => {
            target.worldPosition = twoBezier(ratio, p1, cp, p2);
        };
        return tween(target).to(duration, {}, opts);
    }


    static get_cache(key: string): string {
        let data = sys.localStorage.getItem(key);
        if (data == null || data == "null" || data == undefined || data == "" || data == "NaN") {
            return null;
        }
        return data
    }


    static set_cache(key: string, value: string) {
        sys.localStorage.setItem(key, value);
    };
};


