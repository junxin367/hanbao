import { _decorator, Component, Material, Mesh, utils, MeshRenderer, SpriteAtlas, SpriteFrame, Enum, CCString } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property, executeInEditMode } = _decorator;

enum HorizontalAlignType {
    Left,
    Center,
    Right
}

//图集
class MeshTextAtlas {
    atlasData: SpriteAtlas;
    private typeMap: Map<any, Map<string, SpriteFrame>> = new Map<any, Map<string, SpriteFrame>>();

    constructor(texture: SpriteAtlas) {
        this.atlasData = texture;
        this.InitUV();
    }

    private InitUV() {
        var atlasData = this.atlasData;
        var textureWidth = atlasData.getSpriteFrames()[0].width;
        var textureHeight = atlasData.getSpriteFrames()[0].height;
        for (var i = 0; i < atlasData.getSpriteFrames().length; ++i) {
            var frame: SpriteFrame = atlasData.getSpriteFrames()[i];
            var frameUV =
            {
                xMin: frame.rect.x / textureWidth,
                yMin: frame.rect.y / textureHeight,
                xMax: (frame.rect.x + frame.rect.width) / textureWidth,
                yMax: (frame.rect.y + frame.rect.height) / textureHeight,
                r: frame.rect.width / frame.rect.height
            };
            frame['frameUV'] = frameUV;
        }

    }

    GetType(typeKey: any): Map<string, SpriteFrame> {
        return this.typeMap.get(typeKey || 'default');
    }

    GetOrCreateType(typeKey: any): Map<string, SpriteFrame> {
        if (!this.typeMap.has(typeKey)) {
            this.typeMap.set(typeKey, new Map<string, SpriteFrame>());
        }
        return this.typeMap.get(typeKey);
    }

    GenerateChars(chars: string) {
        var map = this.GetOrCreateType('default');
        for (var i = 0; i < chars.length; ++i) {
            var frameName = chars[i];
            var frame = this.atlasData.getSpriteFrame(frameName)
            if (frame) {
                map.set(chars[i], frame);
            }
            else {
                console.warn("图集里没找到字符:" + chars[i]);
                continue;
            }
        }
    }

    GetTypeFrame(chart: string, typeKey: any): SpriteFrame {
        var map = this.GetType(typeKey);
        return map.get(chart);
    }

    GetFrame(chart: string): SpriteFrame {
        return this.atlasData.getSpriteFrame(chart);;
    }
}

class ToolMeshText {
    static CreateTextMesh(text: string, hAlignType: HorizontalAlignType, atlas: MeshTextAtlas): Mesh {
        var vertices: number[] = [];
        var uvs: number[] = [];
        var indices: number[] = [];

        let length = text.length;
        var verticeCount = length << 2;
        vertices.length = verticeCount;
        uvs.length = verticeCount;
        indices.length = (length << 1) * 3;

        this.SetVerticesBuffer(vertices, uvs,
            text, hAlignType, atlas
        );
        this.SetIndicesBuffer(indices);
        return utils.createMesh({ positions: vertices, indices: indices, uvs: uvs, doubleSided: false });
    }

    static SetIndicesBuffer(indicesBuffer: Uint16Array | Array<number>) {
        var tmp = 0;
        for (var i = 0; i < indicesBuffer.length; i += 6) {
            tmp = (i / 3) << 1;
            indicesBuffer[i + 0] = indicesBuffer[i + 3] = tmp;
            indicesBuffer[i + 1] = indicesBuffer[i + 5] = tmp + 3;
            indicesBuffer[i + 2] = tmp + 1;
            indicesBuffer[i + 4] = tmp + 2;
        }
    }

    static SetVerticesBuffer(verticesBuffer: Array<number>, uvBuffer: Array<number>, text: string, hAlignType: HorizontalAlignType, atlas: MeshTextAtlas) {
        let length = text.length;
        var verticeCount = length << 2;
        let totalwidth = 0;
        {

            for (var i = 0; i < verticeCount; i += 4) {
                let s = text[i / 4];

                var spriteData = atlas.GetFrame(s);
                if (spriteData == null) {
                    console.warn("文字图集里没找到字符:" + s);
                    continue;
                }
                var spriteUV = spriteData['frameUV'];
                totalwidth += spriteUV.r;
            }
        }
        let offestH = 0;
        switch (hAlignType) {
            case HorizontalAlignType.Center:
                offestH = -totalwidth / 2;//-(verticeCount >> 3);
                break;
            case HorizontalAlignType.Left:
                offestH = 0;
                break;
            case HorizontalAlignType.Right:
                offestH = -(verticeCount >> 2);
                break;
        }



        let tmp: number = 0;
        let r: number = 1;

        for (var i = 0; i < verticeCount; i += 4) {
            tmp = (i + 1) % 2 - 1.5;
            let s = text[i / 4];

            var spriteData = atlas.GetFrame(s);
            if (spriteData == null) {
                console.warn("文字图集里没找到字符:" + s);
                continue;
            }
            var spriteUV = spriteData['frameUV'];
            r = spriteUV.r;

            // pos: x,y,z
            var iPos = i * 3;
            // v0: left top
            verticesBuffer[iPos + 0] = offestH;
            verticesBuffer[iPos + 1] = tmp + 1;
            verticesBuffer[iPos + 2] = 0;

            // v1: left bottom
            iPos += 3;
            verticesBuffer[iPos + 0] = offestH;
            verticesBuffer[iPos + 1] = tmp;
            verticesBuffer[iPos + 2] = 0;

            offestH += r;

            // v2: right top
            iPos += 3;
            verticesBuffer[iPos + 0] = offestH;
            verticesBuffer[iPos + 1] = tmp + 1;
            verticesBuffer[iPos + 2] = 0;

            // v3: right bottom
            iPos += 3;
            verticesBuffer[iPos + 0] = offestH;
            verticesBuffer[iPos + 1] = tmp;
            verticesBuffer[iPos + 2] = 0;


            // uv: x, y
            var iUV = i * 2;
            // v0: left top
            uvBuffer[iUV + 0] = spriteUV.xMin;
            uvBuffer[iUV + 1] = spriteUV.yMin;

            // v1: left bottom
            iUV += 2;
            uvBuffer[iUV + 0] = spriteUV.xMin;
            uvBuffer[iUV + 1] = spriteUV.yMax;

            // v2: right top
            iUV += 2;
            uvBuffer[iUV + 0] = spriteUV.xMax;
            uvBuffer[iUV + 1] = spriteUV.yMin;
            // v3: right bottom
            iUV += 2;
            uvBuffer[iUV + 0] = spriteUV.xMax;
            uvBuffer[iUV + 1] = spriteUV.yMax;
        }
    }
}



@ccclass('MeshText')
@executeInEditMode()
export default class MeshText extends Component {
    @property({
        displayName: "图集",
        type: SpriteAtlas
    })
    atlas: SpriteAtlas = null;

    @property({
        displayName: "材质",
        type: Material
    })
    mat: Material = null;

    @property({
        displayName: "图集字符",
    })
    chars: string = "0123456789";

    @property({
        displayName: "布局",
        type: Enum(HorizontalAlignType)
    })
    align: HorizontalAlignType = HorizontalAlignType.Center;

    public _atlas: MeshTextAtlas;
    public hAlignType: HorizontalAlignType = HorizontalAlignType.Center;

    private _text: string = "";
    @property({
        type: CCString
    })
    public get text(): string {
        return this._text;
    }
    public set text(value: string) {
        this._text = value;
        if (value === undefined || value === null) {
            this._text = "";
        }

        //编辑器每次都更新  可能重新设置了材质 图集
        if (EDITOR || !this._atlas) {
            this._atlas = new MeshTextAtlas(this.atlas);
            this._atlas.GenerateChars(this.chars);
            this._atlas = this.Init(this.align);
        }
        this.GenerateFilter();
    }

    start() {
        if (!EDITOR) {
            this._atlas = new MeshTextAtlas(this.atlas);
            this._atlas.GenerateChars(this.chars);
            this._atlas = this.Init(this.align);
        }
        this.text = this._text;
    }

    public mesh: Mesh = null;
    private Init(hAlignType: HorizontalAlignType = HorizontalAlignType.Center) {
        this.hAlignType = hAlignType;
        let meshrender = this.getComponent(MeshRenderer) || this.addComponent(MeshRenderer);
        meshrender.setMaterial(this.mat, 0);
        return this._atlas
    }

    private lastText: string = "";
    private GenerateFilter() {
        if (this.lastText == this._text) return;

        let tmp = this.mesh
        this.mesh = ToolMeshText.CreateTextMesh(this._text, this.hAlignType, this._atlas);
        if (this.mesh) {
            this.getComponent(MeshRenderer).mesh = this.mesh;
        }
        if (tmp) tmp.destroy();
        this.lastText = this._text;
    }
}