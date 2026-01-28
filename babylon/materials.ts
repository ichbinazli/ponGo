declare const BABYLON: any;

export function createBoardMaterial(scene: BABYLON.Scene) {
    const mat = new BABYLON.StandardMaterial("BoardMat", scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#1b1f3b");
    mat.specularColor = BABYLON.Color3.Black();
    mat.emissiveColor = BABYLON.Color3.FromHexString("#0d1321");
    return mat;
}

export function createPaddleMaterial(scene: BABYLON.Scene, tint: BABYLON.Color3, name: string) {
    const mat = new BABYLON.StandardMaterial(name, scene);
    mat.diffuseColor = tint.scale(0.8);
    mat.emissiveColor = tint.scale(0.2);
    mat.specularColor = BABYLON.Color3.FromHexString("#ffffff").scale(0.15);
    return mat;
}

export function createBallMaterial(scene: BABYLON.Scene) {
    const mat = new BABYLON.StandardMaterial("BallMat", scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#f5cb5c");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#f6d670").scale(0.8);
    mat.specularColor = BABYLON.Color3.FromHexString("#ffffff").scale(0.3);
    return mat;
}
