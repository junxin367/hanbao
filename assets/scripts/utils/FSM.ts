import { Component, macro, _decorator } from "cc";

const { ccclass, property } = _decorator;

export class FSMAction {
    onUpdate: Function = null
    onExit: Function = null
    onEnter: Function = null
    id: number = null
    thisObj: any = null
    constructor(thisObj: any, id: number, enter: Function = null, update: Function = null, exit: Function = null) {
        this.thisObj = thisObj
        this.id = id
        this.onUpdate = update
        this.onEnter = enter
        this.onExit = exit
    }
}
@ccclass
export default class FSM extends Component {

    private curr: FSMAction = null;
    private prev: FSMAction = null;
    private _target: any = null;
    private timeElapsed: number = 0;
    private states: { [key: number]: FSMAction } = {};
    private _isPaused: boolean = false;
    private _running: boolean = true;

    get target(): any {
        return this._target;
    }

    pause(): void {
        this._isPaused = true;
    }

    resume(): void {
        this._isPaused = false;
    }
    setRunning(value: boolean): void {
        this._running = value;
    }

    init(e: any): void {
        this.states = {}
        this.curr = null;
        this.prev = null;

        this._target = e;
        this.timeElapsed = 0;
    }

    getState(e: number): FSMAction {
        return this.states[e];
    }

    getCurrState(): FSMAction {
        return this.curr;
    }

    getPrevState(): FSMAction {
        return this.prev;
    }
    addState(action: FSMAction): void {
        this.states[action.id] = action;
    }

    enterState(e: any, t: any = null): void {
        this.timeElapsed = 0;
        let n = this.states[e];
        this.curr = n;
        n.onEnter && n.onEnter.call(n.thisObj, t);
    }

    resetCurrState(): void {
        this.timeElapsed = 0;
        this.curr.onExit && this.curr.onExit.call(this.curr.thisObj);
        this.curr.onEnter && this.curr.onEnter.call(this.curr.thisObj);
    }
    changeState(e: number, force: boolean = false): void {
        let t = this.states[e];
        if (t == null) {






            this.curr?.onExit && this.curr?.onExit.call(this.curr.thisObj);
            this.prev = this.curr;
            this.curr = null;
        } else {

            if (this.curr && this.curr.id == e && !force) return;
            this.timeElapsed = 0;
            this.curr?.onExit && this.curr?.onExit.call(this.curr.thisObj);
            this.prev = this.curr;
            this.curr = t;
            this.curr.onEnter && this.curr.onEnter.call(this.curr.thisObj);
        }
    }

    changeNoneStateDelayCall(delayTime: number, callback: Function): void {
        this.changeState(-999);
        this.scheduleOnce(() => {
            callback();
        }, delayTime);
    }

    revertState(): void {
        this.changeState(this.prev.id);
    }

    isInState(e: any): boolean {
        return this.curr == this.states[e];
    }

    onEnable(): void {
        this.schedule(
            this.fixedUpdate.bind(this),
            1 / 15,
            macro.REPEAT_FOREVER,
            (1 * Math.random()) / 30
        );
    }

    onDisable(): void {
        this.unscheduleAllCallbacks();
    }

    fixedUpdate(e: number): void {
        if (this._running) {
            if (!this._isPaused) {
                this.timeElapsed += e;
                if (this.curr) this.curr.onUpdate && this.curr.onUpdate.call(this.curr.thisObj, e);;
            }
        }
    }
}
