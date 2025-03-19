
import { instantiate, Node, Prefab, Widget } from "cc";
import BasePanel from "../component/BasePanel";
import ResHelper from "../utils/ResHelper";
import BusyLoadingManager, { BUSY_TYPE } from "./BusyLoadingManager";
import Singleton from "./Singleton";
import GameConst, { E_UILAYER } from "../common/GameConst";

export default class WindowManager extends Singleton {
	private _windowContainer: Node;
	private _windows: { [key: string]: BasePanel } = {};

	private uiLayerMap: Map<E_UILAYER, BasePanel[]> = new Map();

	public register(container: Node): void {
		this._windowContainer = container;
		this._windows = {}
		this.uiLayerMap = new Map()

		for (let name in E_UILAYER) {
			let node = new Node(name);
			container.addChild(node);
			let w = node.addComponent(Widget);
			w.left = w.right = w.top = w.bottom = 0;
			w.isAlignBottom = w.isAlignLeft = w.isAlignTop = w.isAlignRight = true;
			w.updateAlignment();

			this.uiLayerMap.set(name as any, []);
		}
	}

	public getLayer(layer: E_UILAYER) {
		return this._windowContainer.getChildByName(layer);
	}

	public closeAll() {
		this.uiLayerMap.forEach((value, key) => {
			for (var i = value.length - 1; i >= 0; i--) {
				if (value[i].winInfo != GameConst.winPath.GameWin)
					this.removeWindow(value[i].winInfo);
			}
		});
	}


	private loadingwin: { [key: string]: boolean } = {}
	async open(winInfo: { name: string, path: string, bundle: string, layer?: E_UILAYER }, showData: any = null, onClose: Function = null, showBusy: boolean = true) {
		if (this.loadingwin[winInfo.path + winInfo.name]) {
			console.log("已经在加载中...")
			return;
		}
		console.log("open window", winInfo.name)
		return new Promise((resolve, reject) => {
			let layer = winInfo.layer ? winInfo.layer : E_UILAYER.弹窗
			let layerStack = this.uiLayerMap.get(layer);

			let hidename = ""
			if (layerStack.length > 0) {
				let topUI = layerStack[layerStack.length - 1];
				if (topUI.winInfo.name != winInfo.name) {
					hidename = topUI.winInfo.name;
				}
			}

			if (!showData) showData = {};
			if (onClose) showData.onClose = onClose;

			if (this._windows[winInfo.name] == null) {
				if (showBusy) BusyLoadingManager.ins.addBusy(BUSY_TYPE.RES);

				this.loadingwin[winInfo.path + winInfo.name] = true;

				ResHelper.loadRes(winInfo.path + winInfo.name, winInfo.bundle, Prefab, (error, assets: Prefab) => {
					this.loadingwin[winInfo.path + winInfo.name] = false;
					if (hidename != "") this.hide(hidename);
					if (error) console.error(error)
					let node = instantiate(assets)
					node.parent = this.getLayer(winInfo.layer || E_UILAYER.弹窗);

					let basePanel = node.getComponent(node.name) as BasePanel
					basePanel.winInfo = winInfo;
					this._windows[winInfo.name] = basePanel
					basePanel.onCreate(showData);
					basePanel.onShow(showData);
					this.checkStack(layerStack, basePanel);
					layerStack.push(basePanel);
					if (showBusy) BusyLoadingManager.ins.removeBusy(BUSY_TYPE.RES);

					resolve(basePanel);
				})
			} else {
				if (hidename != "") this.hide(hidename);
				this.checkStack(layerStack, this._windows[winInfo.name]);
				var panel: BasePanel = this._windows[winInfo.name];
				layerStack.push(panel);
				if (panel.node.active) {
					resolve(panel);
				} else {
					panel.node.active = true;
					panel.onShow(showData)
					resolve(panel);
				}
			}
		})
	}

	private checkStack(uis: BasePanel[], ui: BasePanel) {
		let i = uis.indexOf(ui);
		if (i >= 0) {
			uis = uis.splice(i, 1);
		}
	}

	public removeWindow(winInfo: { name: string, path: string, bundle: string, layer?: E_UILAYER }, destory: boolean = true): void {

		let layer = winInfo.layer ? winInfo.layer : E_UILAYER.弹窗;
		let layerStack = this.uiLayerMap.get(layer);
		if (layerStack.length > 0) {
			let topUI = layerStack[layerStack.length - 1];
			if (topUI.winInfo === winInfo) {
				topUI.data.onClose && topUI.data.onClose()
				topUI.onHide();
				layerStack.pop();
			}

			topUI = layerStack[layerStack.length - 1];
			if (topUI && topUI.node) {
				topUI.node.active = true;
				topUI.onShow(topUI.data);
			}
		}

		if (destory) {
			var panel: BasePanel = this._windows[winInfo.name];
			if (panel) {
				panel.onRecycle()
				panel.node.destroy()
				this._windows[winInfo.name] = null
				delete this._windows[winInfo.name]
			}
		}
		else {
			var panel: BasePanel = this._windows[winInfo.name];
			if (panel)
				panel.node.active = false;
		}
	}

	/**
	 * 面板数据更新
	 * @param name 面板名称
	 * @param data 面板数据
	 * @param isShow 是否在显示的时候才更新
	 * 
	 */
	public panelDataUpdate(name: string, data: Object = null): void {

		if (this._windows[name]) {
			(this._windows[name] as BasePanel).onShow(data);
		}
	}

	public getWin(name: string) {
		if (this._windows[name]) {
			return this._windows[name]
		}
		return null
	}

	private hide(name: string) {
		var panel: BasePanel = this._windows[name];
		if (panel) {
			panel.onHide();
			panel.node.active = false;
		}
	}
}