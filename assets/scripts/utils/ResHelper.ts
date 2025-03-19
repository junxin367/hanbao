import { Asset, assetManager, AssetManager, log, Sprite, Material, Texture2D, SpriteFrame, CCObject, builtinResMgr } from "cc";


const wx = window["wx"] || window["tt"];

abstract class IAsset extends Asset { }

export default class ResHelper {
    public static loadBundle(bundle: string) {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundle, (error, bundle: AssetManager.Bundle) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(bundle);
            })
        })
    }

    public static loadRes<T extends Asset>(path: string, bundle: string, type: typeof IAsset, onComplete: (error: Error, assets: T) => void, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void,) {
        assetManager.loadBundle(bundle, (error, bundle: AssetManager.Bundle) => {
            if (error) {
                log(error)
                return
            }
            bundle.load(path, type as typeof Asset, (onProgress == null) ? (() => { }) : onProgress, onComplete)
        })
    }

    public static loadResSync<T extends Asset>(path: string, bundleName: string, type: typeof IAsset): Promise<T> {
        return new Promise((resolve, rejcet) => {
            this.loadBundle(bundleName).then((bundle: AssetManager.Bundle) => {
                bundle.load(path, type as typeof Asset, null, (err, res: Asset) => {
                    if (err) {
                        console.log("not find", path)
                        resolve(null);
                    }
                    resolve(res as T);
                })
            })
        })
    }


    public static loadReses<T extends Asset>(paths: string[], boundle: string, type: typeof IAsset, onComplete: (error: Error, assets: T[]) => void, onProgress?: (finish: number, total: number, item: AssetManager.RequestItem) => void,) {
        assetManager.loadBundle(boundle, (error, bundle: AssetManager.Bundle) => {
            if (error) {
                log(error)
                return
            }
            bundle.load(paths, type as typeof Asset, (onProgress == null) ? (() => { }) : onProgress, onComplete)
        })
    }

    public static getRes<T extends Asset>(path: string, boundle: string, type: typeof IAsset) {
        return assetManager.getBundle(boundle).get(path, type as typeof Asset) as T
    }

    static setGray(icon: Sprite, isGray: boolean) {
        if (isGray) {
            icon.setMaterial(builtinResMgr.get('2d-gray-sprite'),0);
        } else {
            icon.setMaterial(builtinResMgr.get('2d-sprite'),0);
        }
    }

    static setSpriteFrame(sp: Sprite, path: string, bundle: string = 'resources', callback = null): void {
        let loader = assetManager.getBundle(bundle)
        loader.load(path, SpriteFrame, (error, assets: SpriteFrame) => {
            if (error) {
                log('error', path)
                return
            }
            sp.spriteFrame =assets
            callback && callback()
        })
    }

};


