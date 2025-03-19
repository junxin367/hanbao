
import { PREVIEW } from "cc/env";
import NetControl from "../net_control/script/NetControl";
import { AudioMgr } from "../utils/AudioMgr";

const wx = window["wx"] || window["uc"] || window['tt']
export default class AdManager {
    static bannerAd: any = null;
    static videoAd: any = null;
    static interstitialAd: any = null;
    //格子广告是否加载成功
    static gridAdLoaded: boolean = true;
    static gridAdMoreGame: any = null
    static gridBottom: any = null

    static VIDEO_ID: string = "adunit-92e90f66313ce7e6"
    static CHAPIN_ID: string = "adunit-a8a7186e4dededd9"

    static GRID_ID: string = "adunit-f742a6892a3c9e14";
    static GRID_ID2: string = "adunit-3db3b21864315eba"
    static AD_MORE_GAME_ID: string = "adunit-903d5b5937226874";        //更多游戏  -九宫格
    static AD_BOTTOM_ID: string = "adunit-d6f9dc9e0e1d477a";        //一排格子

    static APPID: string = "wxe41f506957fd4a0c"

    public static share(callback = null) {
        if (window['wx']) {
            wx.shareAppMessage({
                success: () => {
                    if (callback) {
                        callback()
                    }
                },
                fail: () => {

                }
            })
        }
    }
    static onShow(callback) {
        if (window['wx']) {
            wx.onShow(function () {
                if (callback) {
                    callback();
                }
            })
        }
    }
    static showShareMenu(): void {
        if (window['wx']) {
            wx.showShareMenu({
                menus: ['shareAppMessage', 'shareTimeline'],
                withShareTicket: true
            })
            wx.onShareAppMessage(function () {
                return {
                }
            })
        }
    }
    static jump(appid): void {
        if (window['wx']) {
            wx.navigateToMiniProgram({
                appId: appid,
                path: '',
                extraData: null,
                envVersion: 'release',
                success(res) {
                    console.log('跳转成功');
                }
            })
        }
    }
    static showTip(value: string) {
        if (window['wx']) {
            wx.showToast({ title: value, icon: 'none', duration: 1500 })
        }
    }

    static initInterstitialAd() {
        if (wx) {

            if (wx.createInterstitialAd) {
                if (window['tt']) {
                    this.CHAPIN_ID = "2949g04fr05d8hr3bj"
                }

                this.interstitialAd = wx.createInterstitialAd({ adUnitId: this.CHAPIN_ID })
                if (!this.interstitialAd) return;
                this.interstitialAd.onLoad(() => {
                    console.log('插屏初始化成功')

                    this.showInterstitialAd()
                })
                this.interstitialAd.onError((err) => {
                    console.log('interstitialAd onError event emit', err)
                })
                this.interstitialAd.onClose((res) => {
                    console.log('interstitialAd onClose event emit', res)
                })
            }
        }
    }

    static showInterstitialAd() {
        if (this.interstitialAd) {
            if (Date.now() - this.lastshowmaregame > 90 * 1000) {
                this.lastshowmaregame = Date.now();
                this.interstitialAd.show()
            }
        }
    }

    static initGridAd() {
        if (window['tt']) {
            let winSize = wx.getSystemInfoSync();
            const bannerAd = wx.createBannerAd({
                adUnitId: "253b14fjwljn3gkuir",
                style: {
                    top: winSize.windowHeight - 90,
                    left: (winSize.windowWidth - 290) / 2,
                },
            });
            bannerAd.onLoad(() => {
                console.log("banner 加载完毕")
                bannerAd.show();
            });

            bannerAd.onError(err => {
                console.log("banner 错误", err)
            })
        }

        else if (window["wx"]) {
            let winSize = wx.getSystemInfoSync();
            if (wx.createGridAd) {
                let gridAd = wx.createCustomAd({
                    adUnitId: this.GRID_ID,
                    adIntervals: 30,
                    style: {
                        top: 140,
                        left: 0,
                    }
                })
                gridAd.onError((err) => {
                    console.log('格子广告初始化错误', err);
                    if (err['errCode'] >= 1000 && err['errCode'] <= 1008) {
                        this.gridAdLoaded = false;
                    }
                });

                gridAd.show().catch((err) => {
                    console.error('格子广告显示错误', err)
                })
            }

            {
                let gridAd = wx.createCustomAd({
                    adUnitId: this.GRID_ID2,
                    adIntervals: 30,
                    style: {

                        top: winSize.windowHeight - 220,
                        left: winSize.windowWidth - 60,
                    }
                })
                gridAd.onError((err) => {
                    console.log('格子广告初始化错误', err);
                    if (err['errCode'] >= 1000 && err['errCode'] <= 1008) {
                        this.gridAdLoaded = false;
                    }
                });

                gridAd.show().catch((err) => {
                    console.error('格子广告显示错误', err)
                })
            }



            //九宫格
            {
                let winSize = wx.getSystemInfoSync();
                this.gridAdMoreGame = wx.createCustomAd({
                    adUnitId: this.AD_MORE_GAME_ID,
                    adIntervals: 30,
                    style: {
                        top: winSize.windowHeight / 4,
                        left: 0,
                    }
                })
                this.gridAdMoreGame.onError((err) => {
                    console.log('格子广告初始化错误', err);
                });
            }

            {
                this.gridBottom = wx.createCustomAd({
                    adUnitId: this.AD_BOTTOM_ID,
                    adIntervals: 30,
                    style: {
                        top: winSize.windowHeight - 100,
                        left: (winSize.windowWidth - 300) / 2,
                    }
                })

                this.gridBottom.show();
                this.gridBottom.onError((err) => {
                    console.log('底部广告始化错误', err);
                });

            }


            //自动九宫格
            setTimeout(() => {
                this.showMoreGame(150 * 1000)
            }, 150 * 1000);

        } else if (window["uc"]) {
            const bannerAd = wx.createBannerAd({
                style: {
                    gravity: 7,
                },
            });
            bannerAd.onLoad(() => {
                bannerAd.show();
            });
        }
    }

    // 九宫格
    private static lastshowmaregame = 0;
    static showMoreGame(nextopen: number = 0) {
        if (this.gridAdMoreGame) {
            if (Date.now() - this.lastshowmaregame > 30 * 1000) {
                this.lastshowmaregame = Date.now();
                this.gridAdMoreGame.show()
            }
        }

        if (nextopen > 0) {
            setTimeout(() => {
                this.showMoreGame(nextopen)
            }, nextopen);
        }
    }

    static hideMoreGame(): void {
        if (this.gridAdMoreGame != null) {
            this.gridAdMoreGame.hide()
        }
    }

    static videoCall: Function = null
    static showVideo(call: Function): void {
        call(0);
        return;

        if (PREVIEW) {
            call(0);
            return;
        }
        this.videoCall = call
        if (this.videoAd) this.videoAd.show()
            .catch(() => {
                this.videoAd.load()
                    .then(() => this.videoAd.show())
                    .catch(err => {
                        console.log('激励视频 广告显示失败', err)
                        this.showTip('暂无视频可用！')
                    })
            })
    }

    static initVideo(): void {
        if (window["uc"]) {
            if (this.videoAd != null) {
                return;
            }
            console.log("创建广告2")

            let videoAd = wx.createRewardVideoAd()
            this.videoAd = videoAd

            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
            })

            videoAd.onError(err => {
                console.log(err)
                this.videoCall && this.videoCall(-1)
            })

            videoAd.onClose(res => {
                if (res && res.isEnded || res === undefined) {
                    this.videoCall && this.videoCall(0)
                }
                else {
                    this.videoCall && this.videoCall(-1)
                }

            });
        }
        else if (window['tt']) {
            if (this.videoAd != null) {
                return;
            }
            console.log("创建广告2")

            let videoAd = wx.createRewardedVideoAd({ adUnitId: "2212g3h92b7e4kd3le" })
            this.videoAd = videoAd

            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
            })

            videoAd.onError(err => {
                console.log(err)
                this.videoCall && this.videoCall(-1)
            })

            videoAd.onClose(res => {
                if (res && res.isEnded || res === undefined) {
                    this.videoCall && this.videoCall(0)
                }
                else {
                    this.videoCall && this.videoCall(-1)
                }

            });
        }
        else if (window['wx']) {
            if (this.videoAd != null) {
                return;
            }
            console.log("创建广告2")

            let videoAd = wx.createRewardedVideoAd({ adUnitId: this.VIDEO_ID })
            this.videoAd = videoAd

            videoAd.onLoad(() => {
                console.log('激励视频 广告加载成功')
            })

            videoAd.onError(err => {
                console.log(err)
                this.videoCall && this.videoCall(-1)
            })

            videoAd.onClose(res => {
                if (res && res.isEnded || res === undefined) {
                    this.videoCall && this.videoCall(0)
                }
                else {
                    this.videoCall && this.videoCall(-1)
                }

            });
        }


    }


    private static lastautovideo = 0;
    public static autoVide(callback: Function) {
        if (!NetControl.isContrilVersion()) {
            if (Date.now() - this.lastautovideo < 100 * 1000) return;
            this.lastautovideo = Date.now();
            this.showVideo(callback)
        }
    }
    static vibrateShort() {
        console.warn("震动")
        if (wx && AudioMgr.Instance().vibrate)
            wx.vibrateShort()
    }

    static vibrateLong() {
        console.warn("震动")
        if (wx && AudioMgr.Instance().vibrate)
            wx.vibrateLong()
    }
}
