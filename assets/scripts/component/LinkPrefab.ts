import { Component, instantiate, Prefab, _decorator,Node, UITransform, Vec3 } from "cc";
import { EDITOR } from "cc/env";

const {ccclass, executeInEditMode, property,menu} = _decorator;

// // 屏蔽2.3.1版本prefab嵌套prefab的弹框问题
if (EDITOR && !window["Editor"].isBuilder) {
    window["_Scene"].DetectConflict.beforeAddChild = function() {
        return false
    }
}


@ccclass
@executeInEditMode
@menu("公共组件/LinkPrefab")
export default class LinkPrefab extends Component {

    private _prefabNode: Node = null

    @property
    private _prefab: Prefab = null

    @property({type: Prefab, visible: true, displayName: "预制体"})
    set prefab(value: Prefab) {
        this._onPrefabChanged(this._prefab, value)
    }

    get prefab(): Prefab {
        return this._prefab
    }

    private _onPrefabChanged(oldValue:Prefab, newValue:Prefab) {
        if (this._prefabNode) {
            this._prefabNode.destroy();
            this._prefabNode = null;
        }
        this._prefab = newValue
        if (newValue) {
            let prefabNode = instantiate(newValue);
            if(prefabNode){
                this._prefabNode = prefabNode;

                // Object["Flags"].DontSave          // 当前节点不会被保存到prefab文件里
                // Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
                // Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示

                prefabNode["_objFlags"] |= (Object["Flags"].DontSave | Object["Flags"].LockedInEditor | Object["Flags"].HideInHierarchy);
                let transform=prefabNode.getComponent(UITransform)
                prefabNode.setPosition(Vec3.ZERO)
                transform.setContentSize(transform.contentSize)
                this.node.addChild(prefabNode) // 添加到最底层
                prefabNode.setSiblingIndex(0)
                prefabNode.name = "prefabNode";
             
            }
        }
    }

    public getPefabNode(): Node {
        this._initPrefab()      // 防止当前node被默认隐藏导致，prefabNode获取不到
        return this._prefabNode
    }

    public getPrefabComponect<T extends Component>(type: {prototype: T}): T {
        let prefabNode = this._prefabNode
        return prefabNode ? prefabNode.getComponent(type) : null;
    }

    onLoad() {
        this._initPrefab()
    }

    private _initPrefab() {
        if (!this._prefab || this._prefabNode) { 
            return
        }
        let instNode = this.node.getChildByName("prefabNode");      // 避免外部通过instantiate(this.node),导致prefabNode被创建多份
        if (instNode) {
            this._prefabNode = instNode;
        }
        else {
            if (EDITOR) {
                this._onPrefabChanged(null, this._prefab)
            }
            else {
                let prefabNode = instantiate(this._prefab);
                
                if(prefabNode){
                    this._prefabNode = prefabNode;
                    this.node.addChild(prefabNode) // 添加到最底层
                    prefabNode.setSiblingIndex(0)
                    prefabNode.name = "prefabNode";
                    let transform=prefabNode.getComponent(UITransform)
                    prefabNode.setPosition(Vec3.ZERO)
                    transform.setContentSize(transform.contentSize)
                }
            }
        }
    }
}