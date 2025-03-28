import { _decorator, Component, Node, log, v3 } from 'cc';
import { Global } from '../../common/Global';
import BaseComponent from '../../component/Component';
import { Item } from './mapitems/Item';
const { ccclass, property } = _decorator;

@ccclass('Role')
export class Role extends BaseComponent {
    key: string = ''
    stackList: Node[] = [];



    start() {

    }

    canAdd(type: number) {
        return true
    }
    canTake(type: number) {
        if (this.stackList.length > 0) {
            return this.stackList[0].getComponent(Item).type == type;
        }
        return false;
    }
    addOne(item: Node, leftCount: number = -1) {
        let parent = this.GetGameObject('Burger')
        let itemComp = item.getComponent(Item);
        itemComp.delegate = this
        itemComp.index = this.stackList.length;

        let targetPos=v3(0, itemComp.index * 0.3, 0)
        Global.game.flyTo(item, parent, parent.worldPosition.clone().add(v3(0, itemComp.index * 0.3, 0)), 0.25, () => {
            item.position=targetPos
        })
        this.stackList.push(item)
    }
    reduceOne(type: number = 0) {

        let item: Node = null
        if (this.stackList.length > 0) {
            if (type == 0) {
                item = this.stackList.pop()
            } else {
                for (let i = 0; i < this.stackList.length; i++) {
                    if (this.stackList[i].getComponent(Item).type == type) {
                        item = this.stackList[i]
                        this.stackList.splice(i, 1)
                        i--
                        break
                    }
                }
            }

        }
        if (item) {
            item.getComponent(Item).delegate = null;
        }
        return item
    }

    update(deltaTime: number) {
        this.triggerCheck()
    }
    triggerCheck() {

        if (!Global.game || !Global.game.map) return
        let listitems = Global.game.map.allMapItems;
        for (var i = listitems.length - 1; i >= 0; --i) {
            let item = listitems[i];
            let triggerList = item.triggerAreaList;
            if (!triggerList) continue
            for (const trigger of triggerList) {

                if (trigger.pos) {
                    let key = `__player_in_${trigger.type}_${this.key}`
                    let dis = this.node.worldPosition.clone().subtract(trigger.pos).length()
                    if (dis < trigger.dis) {
                        if (item[key]) {
                            item.onTriggerStay(this, trigger.type)
                        } else {
                            item.onTriggerEnter(this, trigger.type)
                        }
                        item[key] = true;
                    } else {
                        if (item[key]) {
                            item.onTriggerExit(this, trigger.type)
                        }
                        item[key] = false;
                    }
                }
            }
        }
    }

}


