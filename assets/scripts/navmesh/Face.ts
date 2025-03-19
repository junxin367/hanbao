import { Vec3 } from "cc";

export class Face {
    a: number = 0;
    b: number = 0;
    c: number = 0;
    centroid: Vec3;
    normal: Vec3;
    constructor(a: number, b: number, c: number) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
}