import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
//移动基类，控制移动的
@ccclass('MoveBase')
export class MoveBase extends Component {
    private _paused: boolean = false;
    private _running: boolean = false;
    public get running(): boolean {
        return this._running;
    }
    public set running(value: boolean) {
        this._running = value;
    }
    private _speed: number = 100;
    public get speed(): number {
        return this._speed;
    }
    public set speed(value: number) {
        this._speed = value;
    }
    start() {

    }

    update(deltaTime: number) {

    }
    public pause(): void {
        this._paused = true;
    }
    public resume(): void {
        this._paused = false;
    }
   
    public lateUpdate(dt: number): void {
        this.step(dt);
    }
    public step(dt: number): void {
        if (!this._paused && this._running) {
            dt > 0.2 && (dt = 0.04);
            this.onStep(dt);
        }
    }
    onStep(dt: number): void {

    }

}


