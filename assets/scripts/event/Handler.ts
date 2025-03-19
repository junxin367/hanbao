
export class Handler {

    protected static _pool: Handler[] = [];
    private static _gid: number = 1;

    caller: Object | null;
    method: Function | null;
    args: any[] | null;
    once = false;

    protected _id = 0;
    constructor(caller: Object | null = null, method: Function | null = null, args: any[] | null = null, once: boolean = false) {
        this.setTo(caller, method, args, once);
    }

    setTo(caller: any, method: Function | null, args: any[] | null, once = false): Handler {
        this._id = Handler._gid++;
        this.caller = caller;
        this.method = method;
        this.args = args;
        this.once = once;
        return this;
    }

    run(): any {
        if (this.method == null) return null;
        var id: number = this._id;
        var result: any = this.method.apply(this.caller, this.args);
        this._id === id && this.once && this.recover();
        return result;
    }

    runWith(data: any): any {
        if (this.method == null) return null;
        var id: number = this._id;
        if (data == null)
            var result: any = this.method.apply(this.caller, this.args);
        else if (!this.args && !data.unshift) result = this.method.call(this.caller, data);
        else if (this.args) result = this.method.apply(this.caller, this.args.concat(data));
        else result = this.method.apply(this.caller, data);
        this._id === id && this.once && this.recover();
        return result;
    }

    clear(): Handler {
        this.caller = null;
        this.method = null;
        this.args = null;
        return this;
    }

    recover(): void {
        if (this._id > 0) {
            this._id = 0;
            Handler._pool.push(this.clear());
        }
    }

    static create(caller: any, method: Function | null, args: any[] | null = null, once: boolean = true): Handler {
        if (Handler._pool.length) return (Handler._pool.pop() as Handler).setTo(caller, method, args, once);
        return new Handler(caller, method, args, once);
    }
}

