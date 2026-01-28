declare const BABYLON: any;
import type { Dimensions } from "./types.js";

export function createTopDownCamera(scene: BABYLON.Scene, canvas: HTMLCanvasElement, boardSize: Dimensions): BABYLON.ArcRotateCamera {
    const radius = Math.max(boardSize.width, boardSize.height) * 1.4;
    const target = new BABYLON.Vector3(0, 0, 0);
    const camera = new BABYLON.ArcRotateCamera("TopDownCamera", 0, Math.PI / 2, radius, target, scene);

    // Allow full horizontal rotation; limit only beta to stay above the board.
    camera.lowerAlphaLimit = undefined;
    camera.upperAlphaLimit = undefined;
    camera.lowerBetaLimit = 0.05;
    camera.upperBetaLimit = Math.PI / 2;

    camera.wheelPrecision = 80;
    camera.panningAxis = new BABYLON.Vector3(1, 0, 1);
    camera.attachControl(canvas, true);

    return camera;
}
