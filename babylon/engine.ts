declare const BABYLON: any;
import type { BabylonContext } from "./types.js";

export function createEngine(canvas: HTMLCanvasElement): BabylonContext {
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new BABYLON.Scene(engine);

    // Keep the canvas responsive without touching existing layout.
    const resizeHandler = () => {
        engine.resize();
    };
    window.addEventListener("resize", resizeHandler);

    // Remove handler when the canvas is torn down.
    scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", resizeHandler);
    });

    return { engine, scene };
}
