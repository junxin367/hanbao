import { EventDispatcher } from "./EventDispatcher";

export class EventManager {
    private static inst: EventManager = null;
    public static get Inst(): EventManager {
        if (this.inst === null) {
            this.inst = new EventManager();
        }
        return this.inst;
    }
    private _ed: EventDispatcher = new EventDispatcher();

    public event(name: string, ...args: any[]) {
        this._ed.event(name as any, args);
    }

    public on(name: string, caller: any, listener: Function): void {
        this._ed.on(name as any, caller, listener);
    }

    public off(name: string, caller: any, listener: Function): void {
        this._ed.off(name as any, caller, listener);
    }

    public offAll(name: string) {
        this._ed.offAll(name);
    }

    public offAllCaller(_this: any) {
        this._ed.offAllCaller(_this);
    }

    public HasListener(name: string) {
        return this._ed.hasListener(name);
    }
}

export enum EventType {
    GameShow = "GameShow",
    GameHide = "GameHide",
    EDIT_MAP = "EDIT_MAP",
    PropChange = "PropChange",
    JoystickStart = 'JoystickStart',
    JoystickMove = "JoystickMove",
    JoystickStop = "JoystickStop",
    EVT_UNLOCK_MAPITEM = "EVT_UNLOCK_MAPITEM",
    CHANGE_SKIN = "ChangeSkin",
    NotEnoughMoney = "NotEnoughMoney"
}