import { _decorator, Component, Node } from 'cc';
import { FollowCamera } from '../modules/game/FollowCamera';
import { GameManager } from '../modules/game/GameManager';
import { Player } from '../modules/game/Player';
const { ccclass, property } = _decorator;

@ccclass('Global')
export class Global  {
    static player:Player
    static camera:FollowCamera
    static game:GameManager
}


