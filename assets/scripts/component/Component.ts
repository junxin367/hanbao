
import { assetManager, Button, Component, EditBox, find, isValid, js, Label, Node, PageView, ProgressBar, ScrollView, Slider, sp, Sprite, SpriteFrame, Texture2D, Toggle, ToggleContainer, _decorator } from "cc";
import { EventManager } from "../event/EventManager";
import ResHelper from "../utils/ResHelper";
import LinkPrefab from "./LinkPrefab";

const { ccclass, property } = _decorator;

@ccclass('BaseComponent')
export default class BaseComponent extends Component {
    constructor() {
        super();
        this.inject();
    }

    private inject() {
        let oldOnLoad = this.onLoad;
        this.onLoad = () => {
            if (oldOnLoad) oldOnLoad.call(this);
            this.autoMapping(this.node);
        }

        let oldOnDisable = this.onDisable;
        this.onDisable = () => {
            this.RemoveAllEventTrigger();
            if (oldOnDisable) oldOnDisable.call(this);
        }
    }



    protected AddEventTrigger(eventName: string, listener: Function) {
        EventManager.Inst.on(eventName, this, listener);
    }

    protected RemoveEventTrigger(eventName: string, listener: Function) {
        EventManager.Inst.off(eventName, this, listener);
    }

    protected RemoveAllEventTrigger() {
        EventManager.Inst.offAllCaller(this);
    }

    protected addClick(node: Node, onClickFunName: string = null, data: any = null) {
        var eventHandler = new Component.EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = js.getClassName(this);
        eventHandler.handler = onClickFunName || "onBtnClicked";
        eventHandler.customEventData = data || node.name;
        var clickEvents = node.getComponent(Button).clickEvents;
        clickEvents.length = 0;
        clickEvents.push(eventHandler);
    }

    autoMapping(node: Node) {
        let info = node.name.split('_')
        if (info.length > 1) {
            let name = node.name
            let type = info[0];
            switch (type) {
                case 'btn':
                    console.log("autoMapping", name, node.name)
                    this[name] = node.getComponent(Button)
                    if (this[name]) this.addClick(node);
                    break
                case 'progress':
                    this[name] = node.getComponent(ProgressBar)
                    break
                case 'txt':
                case 'lbl':
                    this[name] = node.getComponent(Label)
                    break
                case 'sp':
                    this[name] = node.getComponent(Sprite)
                    break
                case 'spine':
                    this[name] = node.getComponent(sp.Skeleton)
                    break
                case 'link':
                    this[name] = node.getComponent(LinkPrefab)
                    break
                case 'toggle':
                case 'tog':
                    this[name] = node.getComponent(Toggle);
                    if (this[name]) {
                        var eventHandler = new Component.EventHandler();
                        eventHandler.target = this.node;
                        eventHandler.component = js.getClassName(this);
                        eventHandler.handler = "onBtnClicked";
                        eventHandler.customEventData = name;
                        var clickEvents = node.getComponent(Toggle).clickEvents;
                        clickEvents.length = 0;
                        clickEvents.push(eventHandler);
                    }
                    break
                case 'toc':
                    this[name] = node.getComponent(ToggleContainer);
                    break;
                case 'page':
                    this[name] = node.getComponent(PageView)
                    break
                case 'list':
                    this[name] = node.getComponent(ScrollView)
                    break
                case 'node':
                    this[name] = node
                    break
                default:
                    this[name] = node
                    break;

            }
        } else {
            if (this[node.name] == null)
                this[node.name] = node
        }

        for (const item of node.children) {
            this.autoMapping(item)
        }
    }

    setSpriteUrl(sp: Sprite, iconUrl: string) {
        assetManager.loadRemote(iconUrl, function (err, spframe: SpriteFrame) {
            if (err) return;





            sp.spriteFrame = spframe;
        });
    }

    private _findInChildren(node: Node, name: string): Node {
        var x = node.getChildByName(name);
        if (x) return x;
        if (node.children.length == 0) return null;

        for (var i = 0; i < node.children.length; ++i) {
            var tmp = this._findInChildren(node.children[i], name);
            if (tmp) return tmp;
        }
        return null;
    }

    private m_objects: Map<string, Node> = new Map<string, Node>();

    protected setSpriteFrame(_sp: Sprite, path: string, bundle: string, callback = null) {
        return ResHelper.loadResSync(path, bundle, SpriteFrame).then((res: SpriteFrame) => {
            if (_sp.isValid)
                _sp.spriteFrame = res;
            callback && callback()

        })
    }


    public GetGameObject(name: string, node: Node = null, refind: boolean = false): Node {
        if (!node) node = this.node;
        if (!isValid(node)) return null;
        if (!refind) {
            if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name];
            if (name == node.name) return node;
        }

        if (name.indexOf("/") != -1) {
            var tmp = find(name, node);
            if (tmp) this.m_objects[name] = tmp;
            return tmp;
        }
        else {
            var tmp = this._findInChildren(node, name);
            if (tmp) this.m_objects[name] = tmp;
            return tmp;
        }
    }


    GetGameObjects(name: string, node: Node = null): any[] {
        if (!node) node = this.node;
        let list = []
        this._getNodes(node, name, list);
        return list;
    }

    private _getNodes(node: Node, name: string, list: any[]) {
        if (node.name == name) {
            list.push(node);
        }
        for (let i = 0; i < node.children.length; ++i) {
            if (node.children[i].name == name) {
                list.push(node.children[i])
            }
            else {
                this._getNodes(node.children[i], name, list);
            }
        }
    }


    public GetSkeleton(name: string): sp.Skeleton {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(sp.Skeleton);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(sp.Skeleton);
        return null;
    }

    public GetSprite(name: string): Sprite {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(Sprite);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(Sprite);
        return null;
    }


    public GetText(name: string): Label {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(Label);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(Label);
        return null;
    }

    public GetProgressBar(name: string): ProgressBar {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(ProgressBar);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(ProgressBar);
        return null;
    }

    public GetButton(name: string): Button {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(Button);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(Button);
        return null;
    }

    public GetInputField(name: string): EditBox {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(EditBox);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(EditBox);
        return null;
    }

    public GetSlider(name: string): Slider {
        if (this.m_objects && this.m_objects.has(name)) return this.m_objects[name].getComponent(Slider);
        var tmp = this.GetGameObject(name);
        if (tmp) return tmp.getComponent(Slider);
        return null;
    }

    public SetText(TextID: string, content: string) {
        if (this.GetText(TextID))
            this.GetText(TextID).string = content;
    }

    public SetInputText(TextID: string, content: string) {
        if (this.GetInputField(TextID))
            this.GetInputField(TextID).string = content;
    }

    public SetProgressBar(TextID: string, p: number) {
        if (this.GetProgressBar(TextID))
            this.GetProgressBar(TextID).progress = p;
    }

    getChildByName(path, node) {
        return find(path, node || this.node);
    }
}
