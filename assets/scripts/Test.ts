import { _decorator, Component, Node } from 'cc';
import { FollowCamera } from './modules/game/FollowCamera';
import { Player } from './modules/game/Player';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {
    @property(FollowCamera)
    camera:FollowCamera;


    @property(Player)
    player:Player;

    start() {
        this.camera.target=this.player.node
    }

    update(deltaTime: number) {
        
    }
}


