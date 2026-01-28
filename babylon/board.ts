declare const BABYLON: any;
import type { Dimensions } from "./types.js";
import { createBoardMaterial } from "./materials.js";

export function createBoard(scene: BABYLON.Scene, size: Dimensions) {
    const board = BABYLON.MeshBuilder.CreateBox("Board", {
        width: size.width,
        height: size.depth ?? 1,
        depth: size.height,
    }, scene);
    board.material = createBoardMaterial(scene);
    board.position = new BABYLON.Vector3(0, -(size.depth ?? 1) / 2, 0);
    board.receiveShadows = true;
    return board;
}
