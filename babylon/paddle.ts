declare const BABYLON: any;
import type { Dimensions } from "./types.js";
import { createPaddleMaterial } from "./materials.js";

export function createPaddle(scene: BABYLON.Scene, name: string, size: Dimensions, tint: BABYLON.Color3) {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, {
        width: size.width,
        height: size.depth ?? 1,
        depth: size.height,
    }, scene);
    mesh.material = createPaddleMaterial(scene, tint, `${name}-mat`);
    mesh.position = new BABYLON.Vector3(0, (size.depth ?? 1) / 2, 0);
    mesh.receiveShadows = false;
    return mesh;
}
