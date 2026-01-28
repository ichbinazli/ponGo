declare const BABYLON: any;
import { createBallMaterial } from "./materials.js";

export function createBall(scene: BABYLON.Scene, radius: number) {
    const sphere = BABYLON.MeshBuilder.CreateSphere("Ball", { diameter: radius * 2, segments: 16 }, scene);
    sphere.material = createBallMaterial(scene);
    sphere.position = new BABYLON.Vector3(0, radius, 0);
    sphere.receiveShadows = false;
    return sphere;
}
