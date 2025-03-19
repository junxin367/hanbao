import { Handler } from "./Handler"

export class EventDispatcher {
    private _events: any;

    hasListener(type: string): boolean {
        var listener: any = this._events && this._events[type];
        return !!listener;
    }

    event(type: string, data: any = null): boolean {
        if (!this._events || !this._events[type]) return false;

        var listeners: any = this._events[type];
        if (listeners.run) {
            if (listeners.once) delete this._events[type];
            data != null ? listeners.runWith(data) : listeners.run();
        } else {
            for (var i: number = 0, n: number = listeners.length; i < n; i++) {
                var listener: Handler = listeners[i];
                if (listener) {
                    (data != null) ? listener.runWith(data) : listener.run();
                }
                if (!listener || listener.once) {
                    listeners.splice(i, 1);
                    i--;
                    n--;
                }
            }
            if (listeners.length === 0 && this._events) delete this._events[type];
        }

        return true;
    }

    on(type: string, caller: any, listener: Function, args: any[] = null): EventDispatcher {
        return this._createListener(type, caller, listener, args, false);
    }

    once(type: string, caller: any, listener: Function, args: any[] = null): EventDispatcher {
        return this._createListener(type, caller, listener, args, true);
    }

    _createListener(type: string, caller: any, listener: Function, args: any[], once: boolean, offBefore: boolean = true): EventDispatcher {
        offBefore && this.off(type, caller, listener, once);
        var handler: Handler = EventHandler.create(caller || this, listener, args, once);
        this._events || (this._events = {});
        var events: any = this._events;
        if (!events[type]) events[type] = handler;
        else {
            if (!events[type].run) events[type].push(handler);
            else events[type] = [events[type], handler];
        }
        return this;
    }

    off(type: string, caller: any, listener: Function, onceOnly: boolean = false): EventDispatcher {
        if (!this._events || !this._events[type]) return this;
        var listeners: any = this._events[type];
        if (listeners != null) {
            if (listeners.run) {
                if ((!caller || listeners.caller === caller) && (listener == null || listeners.method === listener) && (!onceOnly || listeners.once)) {
                    delete this._events[type];
                    listeners.recover();
                }
            } else {
                var count: number = 0;
                for (var i: number = 0, n: number = listeners.length; i < n; i++) {
                    var item: Handler = listeners[i];
                    if (!item) {
                        count++;
                        continue;
                    }
                    if (item && (!caller || item.caller === caller) && (listener == null || item.method === listener) && (!onceOnly || item.once)) {
                        count++;
                        listeners[i] = null;
                        item.recover();
                    }
                }
                if (count === n) delete this._events[type];
            }
        }

        return this;
    }

    offAll(type: string = null): EventDispatcher {
        var events: any = this._events;
        if (!events) return this;
        if (type) {
            this._recoverHandlers(events[type]);
            delete events[type];
        } else {
            for (var name in events) {
                this._recoverHandlers(events[name]);
            }
            this._events = null;
        }
        return this;
    }

    offAllCaller(caller: any): EventDispatcher {
        if (caller && this._events) {
            for (var name in this._events) {
                this.off(name, caller, null);
            }
        }
        return this;
    }

    private _recoverHandlers(arr: any): void {
        if (!arr) return;
        if (arr.run) {
            arr.recover();
        } else {
            for (var i: number = arr.length - 1; i > -1; i--) {
                if (arr[i]) {
                    arr[i].recover();
                    arr[i] = null;
                }
            }
        }
    }
}


class EventHandler extends Handler {

    protected static _pool: any[] = [];

    constructor(caller: any, method: Function, args: any[], once: boolean) {
        super(caller, method, args, once);
    }

    recover(): void {
        if (this._id > 0) {
            this._id = 0;
            EventHandler._pool.push(this.clear());
        }
    }

    static create(caller: any, method: Function, args: any[] = null, once: boolean = true): Handler {
        if (EventHandler._pool.length) return EventHandler._pool.pop().setTo(caller, method, args, once);
        return new EventHandler(caller, method, args, once);
    }
}

