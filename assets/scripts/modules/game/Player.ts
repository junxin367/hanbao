import { _decorator, Node, Vec3, Vec2, v2, Quat, animation, SkeletalAnimation, log, macro, v3, tween, ParticleSystemComponent } from 'cc';
import { Global } from '../../common/Global';
import AssetPool from '../../component/AssetPool';
import Model from '../../data/Model';
import { EventManager, EventType } from '../../event/EventManager';
import RegionalEditor, { REGIONAL_TYPE } from '../map/RegionalEditor';
import { Role } from './Role';
import GameConst, { BOOST_TYPE, E_UPGRADE_TYPE, ItemType } from '../../common/GameConst';
import { Item } from './mapitems/Item';
import WindowManager from '../../manager/WindowManager';
import { AudioMgr } from '../../utils/AudioMgr';
import { DirArrow } from '../guide/DirArrow';
const { ccclass, property } = _decorator;
let qt_0 = new Quat();
let qt_1 = new Quat();
let qt_2 = new Quat();

const SAT = window['SAT'];
var V = SAT.Vector;
var P = SAT.Polygon;

@ccclass('Player')
export class Player extends Role {
    private velocity: Vec2 = v2();
    private _speed: number = 1;

    private get speed() {
        return this._speed * Model.game.getPlayerMoveSpeedRate()
    }

    private ani: SkeletalAnimation;
    private maxNode: Node
    private dirArrow: Node


    canAdd(type: number) {
        if (this.stackList.length > 0) {
            let first = this.stackList[0].getComponent(Item)
            if (type != first.type)
                return false
            if (first.type != ItemType.Litter && this.stackList.length >= Model.game.getPlayerCarryMax())
                return false
        }


        return true;
    }



    onLoad() {
        Global.player = this
    }
    start() {
        this.ani = this.node.getComponent(SkeletalAnimation)
        this.createMax()
        this.createDirArrow()
    }
    async createMax() {
        let item = await AssetPool.Instance().createObjAsync('ui/Max', 'Max');
        item.parent = this.node
        item.position = v3(0, 0, 0);
        this.maxNode = item;
        this.maxNode.setScale(v3(0.6, 0.6, 0.6))
        this.maxNode.active = false
    }
    async createDirArrow() {
        let item = await AssetPool.Instance().createObjAsync('ui/DirArrow', 'DirArrow');
        item.parent = Global.game.node_container
        item.getComponent(DirArrow).target = this
        this.dirArrow = item;
        // item.getComponent(DirArrow).aimPos=v3(0,4,0)
    }
    setAimPos(v: Vec3) {
        if (this.dirArrow) {
            this.dirArrow.getComponent(DirArrow).aimPos = v
        }
    }
    onEnable() {
        EventManager.Inst.on(EventType.JoystickMove, this, this.joystickMove);
        EventManager.Inst.on(EventType.JoystickStop, this, this.joystickStop);
    }
    private joystickMove(e: { speedType: number, moveDistance: Vec2 }) {

        let pos = e.moveDistance.rotate(Math.PI / 4)
        pos = pos.normalize()
        this.velocity.set(-pos.y, -pos.x)

        Global.game.removeCountDownUI()
    }

    private joystickStop(e) {
        this.velocity.set(Vec2.ZERO);
        this.checkCollideWithCustomer();
    }
    //检测和捣乱，睡觉顾客的碰撞
    private checkCollideWithCustomer() {
        let customer = Global.game.getCallingCustomer()
        if (customer) {
            Global.game.createCountDownUI(customer)
        } else {
            customer = Global.game.getSleepCustomer()
            if (customer) {
                Global.game.createCountDownUI(customer)
            }

        }
    }


    private response = new SAT.Response();
    private polygon1 = new P(new V(0, 0), []);
    private polygon2 = new P(new V(0, 0), []);

    get playerPolygon() {
        var points = [];
        var pos = this.node.worldPosition;
        var w = 0.5
        points.push(new V(pos.x - w / 2, pos.z));
        points.push(new V(pos.x + w / 2, pos.z));
        points.push(new V(pos.x + w / 2, pos.z + w));
        points.push(new V(pos.x - w / 2, pos.z + w));
        return points.reverse();
    }

    playerCollision() {
        var poys: RegionalEditor[] = Global.game.map.obstacle;
        for (var i = 0; i < poys.length; ++i) {
            let wrap = poys[i];
            if (wrap.type == REGIONAL_TYPE.NAVMESH_ONLEY) continue;
            if (!wrap.node.activeInHierarchy) continue;
            this.polygon1.setPoints(wrap.worldVertexXZ);
            this.polygon2.setPoints(this.playerPolygon);
            var response = this.response;
            response.clear();
            var collided = SAT.testPolygonPolygon(this.polygon1, this.polygon2, response);
            if (collided) {
                let pos = this.node.worldPosition.clone();
                pos.x += response.overlapV.x;
                pos.z += response.overlapV.y;
                this.node.worldPosition = pos;
                // this.node.worldPosition.x += response.overlapV.x;
                // this.node.worldPosition.z += response.overlapV.y;
            }
        }
    }

    public pauseMove = false;
    update(dt: number) {
        super.update(dt)

        if (this.pauseMove) {
            this.velocity.x = this.velocity.y = 0;
        }

        //移动
        let pos = this.node.position;
        pos.set(pos.x + this.velocity.x * dt * this.speed, 0, pos.z + this.velocity.y * dt * this.speed);
        this.node.position = this.node.position.lerp(pos, 0.5);

        this.playerCollision();

        //旋转
        if (this.velocity.lengthSqr() > 0) {
            const targetRotation = Math.atan2(this.velocity.x, this.velocity.y) * 180 / Math.PI;
            Quat.fromEuler(qt_0, 0, targetRotation, 0)
            Quat.slerp(qt_1, this.node.rotation, qt_0, 0.2);
            this.node.setRotation(qt_1)
        } else {
        }

        this.updateAni()

        //更新轮滑状态
        this.updateSkate(dt);

        //检查靠近外卖员  
        this.checkDeliveryDriver();

        if (this.maxNode && this.maxNode.active) {
            this.maxNode.setWorldRotation(Quat.fromEuler(qt_2, 10, -45, 0))
        }
    }


    private _deliveryDriverOpen: boolean = false;
    private checkDeliveryDriver() {
        if (Global.game.deliveryDriver && Global.game.deliveryDriver.isOrding()) {
            let dis = this.node.worldPosition.clone().subtract(Global.game.deliveryDriver.node.worldPosition).length()
            if (this._deliveryDriverOpen && dis > 1.5) {
                this._deliveryDriverOpen = false;
                return
            }
            if (dis < 1) {
                if (!this._deliveryDriverOpen) {
                    this._deliveryDriverOpen = true;
                    WindowManager.Instance().open(GameConst.winPath.SpecialOrderWin);
                }
                Global.game.deliveryDriver.onTriggerStay(this, 0)
            }
        }
    }

    private Inlineskate_blue: Node = null;
    private Inlineskate_pink: Node = null;
    private Gloves: Node = null;
    private updateSkate(dt: number) {

        for (var key in Model.game.boost) {
            Model.game.boost[key] -= dt;
            if (Model.game.boost[key] < 0)
                Model.game.boost[key] = 0;
        }

        let hasPink = Model.game.boost[BOOST_TYPE.BOOST_INLINESKATE_PINK] > 0;
        let hasBlue = Model.game.boost[BOOST_TYPE.BOOST_INLINESKATE_BLUE] > 0;

        this.Inlineskate_blue.active = hasBlue;
        this.Inlineskate_pink.active = hasPink;
        this.Gloves.active = Model.game.boost[BOOST_TYPE.BOOST_GLOVES] > 0;
        this.IAP_Ride.active = Model.game.boost[BOOST_TYPE.PINGHENGCHE] > 0;
    }

    private IAP_Ride: Node = null;


    //动画流程的播放
    updateAni() {
        let hasphc = Model.game.hasPingHengChe();
        if (this.velocity.equals(Vec2.ZERO) || hasphc) {
            if (this.stackList.length == 0)
                this.playAni('Player_Idle')
            else
                this.playAni('Stack_Idle')
        } else {
            if (this.stackList.length == 0)
                this.playAni('player_run')
            else
                this.playAni('Stack_Run')
        }
    }
    private curAni: string = ''
    playAni(aniName) {
        if (this.curAni != aniName) {
            this.ani.play(aniName)
            this.curAni = aniName
        }
    }
    addMoney(count: number, calRate: boolean = true) {
        let rate = Model.game.getPlayerProfitRate()
        if (calRate)
            Model.game.money += count * rate
        else
            Model.game.money += count

    }

    getStackItemPos(index: number): { pos: Vec3, rot: Quat } {
        let node_burger = this.GetGameObject('Burger')
        let pos = node_burger.worldPosition.clone()// node_burger.up.clone();

        let ypos = node_burger.up.clone().normalize();
        let xzpos = v3(this.velocity.x, 0, this.velocity.y).negative().normalize()

        let r2 = (0.2 * Math.sin(index / 40) * Math.PI / 2) * this.velocity.normalize().length()
        Vec3.add(pos, pos, ypos.multiplyScalar(index * .3 * (1 - r2)));
        Vec3.add(pos, pos, xzpos.multiplyScalar(index * .2 * Math.sin(index / 40) * Math.PI / 2));

        let rot = node_burger.worldRotation.clone();
        Quat.rotateX(rot, rot, (-90 / 180 * Math.PI * index / 30) * this.velocity.normalize().length());

        return { pos, rot }
    }
    addOne(item: Node) {
        let itemComp = item.getComponent(Item);
        itemComp.delegate = this
        itemComp.index = this.stackList.length;
        AudioMgr.Instance().playSFX('papercup_edit')
        let parent = this.GetGameObject('Burger')
        let targetPos = v3(0, itemComp.index * 0.3, 0)
        Global.game.flyTo(item, parent, parent.worldPosition.clone().add(v3(0, itemComp.index * 0.3, 0)), 0.25, () => {
            item.position = targetPos
            itemComp.state = 1

        })
        this.stackList.push(item)

        this.checkMax()

        //burger.flyTo(v3(0, burger.index * 0.3, 0))
    }
    checkMax() {
        this.maxNode.active = this.stackList.length >= Model.game.getPlayerCarryMax()
        if (this.stackList.length > 0) {
            if (this.stackList[0].getComponent(Item).type == ItemType.Litter)
                this.maxNode.active = false
        }
        if (this.maxNode.active) {
            this.maxNode.setPosition(v3(0, Math.floor(this.stackList.length / 2) * 0.4 + 2, 0))
        }
    }
    reduceOne(type: number = 0) {
        let item = super.reduceOne(type)
        this.checkMax()
        if (item)
            AudioMgr.Instance().playSFX('papercup_edit')
        return item
    }
}


