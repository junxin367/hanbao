import { NodePool, Prefab, instantiate, warn, Node } from "cc";
import Singleton from "../manager/Singleton";
import ResHelper from "../utils/ResHelper";
import Component from "./Component";

export default class AssetPool extends Singleton {


    private pools: Map<string, NodePool> = new Map();
    private prefabs: Map<string, Prefab> = new Map();
    public addPrefab(prefab: Prefab, name: string) {
        if (this.prefabs.has(name)) return
        prefab.addRef();
        this.pools.has(name) || this.createPool(name);
        this.getPool(name).put(instantiate(prefab));
        this.prefabs.set(name, prefab);
    }
    public clear(name: string) {
        const pool = this.getPool(name);
        if (pool) {
            pool.clear();
        }
    }
    public clearPrefabs() {
        this.prefabs.forEach((prefab, name) => {
            prefab.decRef();
            const pool = this.pools.get(name);
            if (pool) {
                pool.clear();
                this.pools.delete(name);
            }
        });
        this.prefabs.clear();
    }
    public async createObjAsync(url: string, name: string): Promise<Node> {
        let prefab = this.getPrefab(name);
        if (!prefab) {
            prefab = await ResHelper.loadResSync(url,'prefabs', Prefab)
            this.addPrefab(prefab, name);
        }
        return this.createObjWithPrefab(prefab, name);
    }
    public createObjWithPrefab(prefab: Prefab, name: string): Node {
        const t = this.get(name);
        if (t)
            return t;
        const node = instantiate(prefab);
        node['__pool__'] = name;
        return node;
    }
    createObject(name: string) {
        const t = this.get(name);
        if (t)
            return t;
        const n = this.getPrefab(name);
        if (n) {
            warn(" createObject pool is empty, createObjWithPrefab", name);
            return this.createObjWithPrefab(n, name);
        }
        else {
            warn("Can't createObject prefab is null", name);
            return null;
        }
    }
    createPool(name: string) {
        console.log("创建对象池", name);
        const nodePool = new NodePool();
        this.pools.set(name, nodePool);
        return nodePool;
    }
    get(url: string, t = null, num = null) {
        var o = this.getPool(url, num), r = null;
        return o.size() > 0 && ((r = o.get(t))['__pool__'] = url), r;
    }
    public getPool(name: string, num?: number): NodePool {
        let nodePool = this.pools.get(name);
        if (!nodePool) {
            nodePool = this.createPool(name);
        }
        return nodePool;
    }
    public getPrefab(name: string): Prefab | undefined {
        return this.prefabs.get(name);
    }
    public put(node: Node | Component) {
        if (node instanceof Component) {
            node = node.node;
        }
        const poolName = node['__pool__'];
        if (poolName) {
            const pool = this.getPool(poolName);
            if (pool) {
                pool.put(node);
            }
        }
    }
    public removePool(name: string) {
        if (this.pools.has(name)) {
            this.pools.delete(name);
        }
    }

  
}
