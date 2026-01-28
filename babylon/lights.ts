declare const BABYLON: any;

export function createLights(scene: BABYLON.Scene) {
    const hemi = new BABYLON.HemisphericLight("Hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.9;
    hemi.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const dir = new BABYLON.DirectionalLight("Dir", new BABYLON.Vector3(-0.5, -1, 0.5), scene);
    dir.intensity = 0.6;

    return { hemi, dir };
}
