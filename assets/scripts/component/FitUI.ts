import { _decorator, Widget, Enum, view, sys, Canvas, Component } from "cc";
import { EDITOR, JSB } from "cc/env";

const { ccclass, property, executeInEditMode, menu, requireComponent } = _decorator;

export enum FitUIPlatform { ANDROID, IOS, OTHER }

export enum FitUIOrientation { HORIZONTAL, VERTICAL }

const IsH = function () { return this.orientation == FitUIOrientation.HORIZONTAL };
const IsV = function () { return this.orientation == FitUIOrientation.VERTICAL };

@ccclass
@menu("公用组件/FitUI")
@executeInEditMode
@requireComponent(Widget)
export default class FitUI extends Component {


    @property({ displayName: "适配方向", type: Enum(FitUIOrientation) })
    orientation: FitUIOrientation = FitUIOrientation.VERTICAL;



    @property({ displayName: "安卓设备", type: Enum(FitUIPlatform) })
    get a() { return FitUIPlatform.ANDROID; }

    @property({ displayName: "left", visible: IsH })
    left: boolean = false;

    @property({ displayName: "right", visible: IsH })
    right: boolean = false;

    @property({ displayName: "top", visible: IsV })
    top: boolean = false;

    @property({ displayName: "bottom", visible: IsV })
    bottom: boolean = false;



    @property({ displayName: "苹果设备", type: Enum(FitUIPlatform) })
    get i() { return FitUIPlatform.IOS; }

    @property({ displayName: "left", visible: IsH })
    iLeft: boolean = false;

    @property({ displayName: "right", visible: IsH })
    iRight: boolean = false;

    @property({ displayName: "top", visible: IsV })
    iTop: boolean = false;

    @property({ displayName: "bottom", visible: IsV })
    iBottom: boolean = false;



    @property({ displayName: "其它设备", type: Enum(FitUIPlatform) })
    get o() { return FitUIPlatform.OTHER; }

    @property({ displayName: "left", visible: IsH })
    oLeft: boolean = false;

    @property({ displayName: "right", visible: IsH })
    oRight: boolean = false;

    @property({ displayName: "top", visible: IsV })
    oTop: boolean = false;

    @property({ displayName: "bottom", visible: IsV })
    oBottom: boolean = false;


    onLoad() {
        EDITOR && this.getComponents(FitUI).length > 2 && this.node.removeComponent(this);
        (!EDITOR) && this.applySettings();

      
      
    }
   

    private applySettings() {
        let size = view.getVisibleSize()
        let nPlatform = sys.platform;
        let tSize = size.width / size.height;
        tSize = this.orientation == FitUIOrientation.VERTICAL ? tSize : 1 / tSize;
        let dSize = 0.5; 
        if (tSize >= dSize) {
            this.updateFitStrategy(true, true);
            return;
        } else {
            this.orientation == FitUIOrientation.VERTICAL && this.updateFitStrategy(true, false);
            this.orientation == FitUIOrientation.HORIZONTAL && this.updateFitStrategy(false, true);
        }

        let aRule = { top: this.top, left: this.left, right: this.right, bottom: this.bottom };
        let iRule = { top: this.iTop, left: this.iLeft, right: this.iRight, bottom: this.iBottom };
        let oRule = { top: this.oTop, left: this.oLeft, right: this.oRight, bottom: this.oBottom };
        switch (nPlatform) {
            case sys.Platform.ANDROID:
                this.fitPhone(aRule);
                break;
            case sys.Platform.IOS:
                this.fitPhone(iRule);
                break;
            default: 
                if (!JSB) {
                    switch (sys.os) {
                        case sys.OS.IOS:
                            this.fitPhone(iRule);
                            break;
                        case sys.OS.ANDROID:
                            this.fitPhone(aRule);
                            break;
                        default: 
                            this.fitPhone(oRule)
                            break;
                    }
                }
                break;
        }
    }


    private fitPhone(rule: { top: boolean, left: boolean, right: boolean, bottom: boolean }) {

        let size = view.getVisibleSize();
        let height = this.orientation == FitUIOrientation.VERTICAL ? size.height : size.width
        let liuhaiHeight = height * 44 / 812; 
        let bottomHeight = height * 34 / 812; 

        switch (this.orientation) {
            case FitUIOrientation.VERTICAL:
                rule.top && this.updateWidget("top", liuhaiHeight);
                rule.bottom && this.updateWidget("bottom", bottomHeight);
                break;
            case FitUIOrientation.HORIZONTAL:
                rule.left && this.updateWidget("left", bottomHeight);
                rule.right && this.updateWidget("right", liuhaiHeight);
                break;
            default:
                break;
        }
    }


    private updateWidget(orientation: string, delta: number) {
        let widget = this.getComponent(Widget);
        if (widget) {
            if (!widget[`default_${orientation}`]) {
                widget[`default_${orientation}`] = widget[`${orientation}`];
            }
            widget[`${orientation}`] = widget[`default_${orientation}`] + delta;
        }
    }


    private updateFitStrategy(fitWidth: boolean, fitHeight: boolean) {
        
    }

}