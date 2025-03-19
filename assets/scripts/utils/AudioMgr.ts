import { director, AudioSource, AudioClip, assetManager, Node } from 'cc';
import Singleton from '../manager/Singleton';
import ResHelper from './ResHelper';
import Utils from './Utils';

export class AudioMgr extends Singleton {
    private bgmAudioSource: AudioSource;
    private sfxAudioSource: AudioSource;


    private _music: number = 1;
    private _vibrate: number = 1;

    public get music() {
        return this._music;
    }

    public set music(value) {
        this._music = value;
        if (!value) {
            this.stopBGM();
        } else {
            this.playBGM('Athens_Street_Cafe_Ambience')
        }
        Utils.set_cache("music", value.toString());
    }

    public get vibrate() {
        return this._vibrate;
    }

    public set vibrate(value) {
        this._vibrate = value;
        Utils.set_cache("vibrate", value.toString());
    }

    public init(): void {

        this.music = Number(Utils.get_cache("music") || "1");
        this.vibrate = Number(Utils.get_cache("vibrate") || "1");


        const audioNode = new Node('AudioNode');
        director.getScene().addChild(audioNode);

        this.bgmAudioSource = audioNode.addComponent(AudioSource);
        this.bgmAudioSource.loop = true;
        this.bgmAudioSource.volume = 1;

        this.sfxAudioSource = audioNode.addComponent(AudioSource);
        this.sfxAudioSource.volume = 1;
    }

    public playBGM(url: string): void {
        if (!this.music) return;
        this.loadAudio(url, (clip: AudioClip) => {
            this.bgmAudioSource.clip = clip;
            this.bgmAudioSource.play();
        });
    }

    public stopBGM(): void {
        this.bgmAudioSource?.stop();
    }

    public playSFX(url: string): void {
        if (!this.music) return;
        this.loadAudio(url, (clip: AudioClip) => {
            this.sfxAudioSource.clip = clip;
            this.sfxAudioSource.playOneShot(clip);
        });
    }

    public stopSFXAll(): void {
        this.sfxAudioSource.stop()
    }

    private loadAudio(url: string, callback: Function, bundle: string = 'sounds'): void {
        ResHelper.loadRes(url, bundle, AudioClip, (err, clip) => {
            if (err) {
                console.error(`Failed to load audio clip: ${url}`);
                return;
            }
            callback(clip);
        })
    }
    vibrateShort() {
        if (!this.vibrate) return;
        window['wx'] && window['wx'].vibrateShort({})
    }
}
