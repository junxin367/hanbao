import { Component, Enum, Event, EventTarget, EventTouch, Input, input, Node, UIOpacity, UITransform, v2, v3, Vec2, Vec3, _decorator } from "cc";
import { EventManager, EventType } from "../../event/EventManager";

const { ccclass, property } = _decorator;


export const instance = new EventTarget();
export enum DirectionType {
    FOUR,
    EIGHT,
    ALL,
}

export enum SpeedType {
    STOP,
    NORMAL,
    FAST,
}

export enum JoystickType {
    FIXED,
    FOLLOW,
}

let KeyCode = {
    KeyA: 'KeyA',
    KeyD: 'KeyD',
    KeyW: 'KeyW',
    KeyS: 'KeyS',
    KeyLeft: 'ArrowLeft',
    KeyRight: 'ArrowRight',
    KeyUp: 'ArrowUp',
    KeyDown: 'ArrowDown',
}

@ccclass
export default class Joystick extends Component {
    @property({
        type: Node,
        displayName: "Dot",
        tooltip: "摇杆操纵点",
    })
    dot: Node = null;

    @property({
        type: Node,
        displayName: "Ring",
        tooltip: "摇杆背景节点",
    })
    ring: Node = null;

    @property({
        type: Enum(JoystickType),
        displayName: "Touch Type",
        tooltip: "触摸类型",
    })
    joystickType = JoystickType.FIXED;

    @property({
        type: Enum(DirectionType),
        displayName: "Direction Type",
        tooltip: "方向类型",
    })
    directionType = DirectionType.ALL;

    @property({
        type: Node,
        tooltip: "摇杆所在位置",
    })
    _stickPos = null;

    @property({
        type: Node,
        tooltip: "触摸位置",
    })
    _touchLocation = null;

    @property({ tooltip: "半径" })
    _radius = 0;


    private defaultpos: Vec3 = v3();
    onLoad() {
        this._radius = this.ring.getComponent(UITransform).width / 2;
        this._initTouchEvent();
        if (this.joystickType === JoystickType.FOLLOW) {
            // this.node.opacity = 0;
        }

        this.defaultpos = this.ring.getPosition().clone();
    }

    onEnable() {
        instance.on("set_joystick_type", this._onSetJoystickType, this);
        this.node.getComponent(UIOpacity).opacity = 0;
        this.registWxKey();
    }

    keyDown: any;
    keyUp: any;
    registWxKey() {
        this.keyDown = this.onWxKeyDown.bind(this);
        this.keyUp = this.onWxKeyUp.bind(this);
        let wx = window['wx'];
        if (wx && !window['tt']) {
            wx.onKeyDown(this.keyDown)
            wx.onKeyUp(this.keyUp)
        } else {
            input.on(Input.EventType.KEY_DOWN, this.keyDown)
            input.on(Input.EventType.KEY_DOWN, this.keyDown)
        }
    }

    unRegistWxKey() {
        let wx = window['wx'];
        if (wx && !window['tt']) {
            wx.offKeyDown(this.keyDown)
            wx.offKeyUp(this.keyUp)
        } else {
            input.off(Input.EventType.KEY_DOWN, this.keyDown)
            input.off(Input.EventType.KEY_DOWN, this.keyDown)
        }
    }

    keysMap: Map<string, boolean> = new Map();
    onWxKeyDown(res: any) {
        this.keysMap.set(res.code || res.keyCode + "", true);
    }

    onWxKeyUp(res: any) {
        this.keysMap.set(res.code || res.keyCode + "", false);
    }

    moved = false;
    info: any;
    protected update(dt: number): void {
        this.moveDelta.set(Vec2.ZERO);
        if (this.keysMap.get(KeyCode.KeyA) || this.keysMap.get(KeyCode.KeyLeft) || this.keysMap.get("65") || this.keysMap.get("37")) {
            this.moveDelta.x -= 1500 * dt;
        }
        if (this.keysMap.get(KeyCode.KeyD) || this.keysMap.get(KeyCode.KeyRight) || this.keysMap.get("68") || this.keysMap.get("39")) {
            this.moveDelta.x += 1500 * dt;
        }
        if (this.keysMap.get(KeyCode.KeyW) || this.keysMap.get(KeyCode.KeyUp) || this.keysMap.get("87") || this.keysMap.get("38")) {
            this.moveDelta.y += 1500 * dt;
        }
        if (this.keysMap.get(KeyCode.KeyS) || this.keysMap.get(KeyCode.KeyDown) || this.keysMap.get("83") || this.keysMap.get("40")) {
            this.moveDelta.y -= 1500 * dt;
        }
        if (this.moveDelta.x != 0 || this.moveDelta.y != 0) {
            this.moved = true;
            this.moveDelta = this.moveDelta.normalize();
            EventManager.Inst.event(EventType.JoystickMove, { SpeedType: SpeedType.NORMAL, moveDistance: this.moveDelta });
            this.moveDelta.multiplyScalar(125);
            this.dot.setPosition(this.ring.getPosition().x + this.moveDelta.x, this.ring.getPosition().y + this.moveDelta.y);
        } else {
            if (this.moved) {
                this.moved = false;
                EventManager.Inst.event(EventType.JoystickStop)
                this.dot.setPosition(this.ring.getPosition());
            }
        }
    }

    onDisable() {
        instance.off("set_joystick_type", this._onSetJoystickType, this);
        this.unRegistWxKey();
    }

    _onSetJoystickType(type: JoystickType) {
        this.joystickType = type;
        this.node.getComponent(UIOpacity).opacity = type === JoystickType.FIXED ? 255 : 0;
    }

    _initTouchEvent() {
        // set the size of joystick node to control scale
        this.node.on(Node.EventType.TOUCH_START, this._touchStartEvent, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._touchMoveEvent, this);
        this.node.on(Node.EventType.TOUCH_END, this._touchEndEvent, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this._touchEndEvent, this);
    }

    _touchStartEvent(event: EventTouch) {
        this.node.getComponent(UIOpacity).opacity = 255;
        instance.emit(Node.EventType.TOUCH_START, event);
        let touch = event.getUILocation()
        const touchPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(touch.x, touch.y));
        if (this.joystickType === JoystickType.FIXED) {
            this._stickPos = this.ring.getPosition();
            const distance = Vec3.distance(touchPos, this.ring.getPosition())
            this._radius > distance && this.dot.setPosition(touchPos);
        } else if (this.joystickType === JoystickType.FOLLOW) {
            this._stickPos = touchPos;
            this._touchLocation = event.getUILocation()
            this.ring.setPosition(touchPos);
            this.dot.setPosition(touchPos);
        }

        EventManager.Inst.event(EventType.JoystickStart)
    }

    moveDelta = v2();

    _touchMoveEvent(event: EventTouch) {
        if (this.joystickType === JoystickType.FOLLOW && this._touchLocation === event.getLocation()) {
            return false;
        }
        let touch = event.getUILocation()
        const touchPos = this.ring.getComponent(UITransform).convertToNodeSpaceAR(v3(touch.x, touch.y));
        const distance = touchPos.length();

        const posX = this._stickPos.x + touchPos.x;
        const posY = this._stickPos.y + touchPos.y;

        let p = this.moveDelta;
        p.x = posX - this.ring.getPosition().x;
        p.y = posY - this.ring.getPosition().y;
        p = p.normalize();

        let speedType;

        if (this._radius > distance) {
            this.dot.setPosition(v3(posX, posY));

            speedType = SpeedType.NORMAL;
        } else {
            // 控杆永远保持在圈内，并在圈内跟随触摸更新角度
            const x = this._stickPos.x + p.x * this._radius;
            const y = this._stickPos.y + p.y * this._radius;
            this.dot.setPosition(v3(x, y));

            speedType = SpeedType.FAST;
        }
        EventManager.Inst.event(EventType.JoystickMove, { speedType, moveDistance: p })
    }

    _touchEndEvent(event: EventTouch) {
        this.dot.setPosition(this.ring.getPosition());
        if (this.joystickType === JoystickType.FOLLOW) {
            this.node.getComponent(UIOpacity).opacity = 0;
            this._stickPos = this.defaultpos;
            this.ring.setPosition(this.defaultpos);
            this.dot.setPosition(this.defaultpos);

        }

        EventManager.Inst.event(EventType.JoystickStop)
    }
}
