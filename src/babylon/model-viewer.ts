/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
// Babylon.js 3D Model Viewer
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Color3, Color4, Vector3 } from '@babylonjs/core';
import { PongGame } from './pong-game';

let engine: BABYLON.Engine | null = null;
let resizeHandler: (() => void) | null = null;

export function initModelViewer(): void {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
    
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Dispose previous engine if re-initializing
    if (engine) {
        engine.dispose();
        engine = null;
    }
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }

    // Create Babylon engine
    engine = new BABYLON.Engine(canvas, true);
    
    // Disable Babylon.js default loading screen/logo
    BABYLON.SceneLoader.ShowLoadingScreen = false;
    engine.loadingScreen = {
        displayLoadingUI: () => undefined,
        hideLoadingUI: () => undefined
    } as BABYLON.ILoadingScreen;
    
    // Create scene
    const createScene = (): any => {
        const scene = new BABYLON.Scene(engine as BABYLON.Engine);
        
        // Set background color to a dark color
        scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);
        
        // Create a fallback camera (will be replaced by model camera if available)
        const fallbackCamera = new BABYLON.ArcRotateCamera(
            "fallbackCamera",
            Math.PI / 2,
            Math.PI / 2.5,
            5,
            new Vector3(0, 0, 0),
            scene
        );
        
        // Attach camera controls to canvas
        fallbackCamera.attachControl(canvas, true);
        
        // Set camera limits
        fallbackCamera.lowerRadiusLimit = 0.5;
        fallbackCamera.upperRadiusLimit = 10;
        fallbackCamera.wheelPrecision = 50;
        
        // Create hemispheric light
        const light1 = new BABYLON.HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            scene
        );
        light1.intensity = 0.7;
        
        // Create directional light for better shadows
        const light2 = new BABYLON.DirectionalLight(
            "light2",
            new Vector3(-1, -2, -1),
            scene
        );
        light2.intensity = 0.5;
        
        // Add a point light for highlights
        const light3 = new BABYLON.PointLight(
            "light3",
            new Vector3(0, 2, 2),
            scene
        );
        light3.intensity = 0.3;
        
        // Load the 3D model
        BABYLON.SceneLoader.Append(
            "/babylon/", // Root URL
            "3DModel.glb", // File name
            scene,
            function (loadedScene: any) {
                console.log("Model loaded successfully");
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Try to use camera from model
                let modelCamera: any = null;
                
                // Check if model has cameras
                if (scene.cameras && scene.cameras.length > 0) {
                    console.log("Available cameras:", scene.cameras.map((c: any) => c.name));
                    
                    // Get first non-fallback camera from model
                    modelCamera = scene.cameras.find((c: any) => c.name !== "fallbackCamera");
                    
                    if (modelCamera) {
                        console.log("Using model camera:", modelCamera.name);
                        
                        // Set it as active camera
                        scene.activeCamera = modelCamera;
                        modelCamera.attachControl(canvas, true);
                        
                        // Add zoom functionality with mouse wheel
                        const zoomSpeed = 0.3;
                        const minDistance = 0.5;
                        const maxDistance = 10;
                        
                        canvas.addEventListener('wheel', (event: WheelEvent) => {
                            event.preventDefault();
                            
                            if (modelCamera && modelCamera.position && modelCamera.target) {
                                // Get direction from target to camera
                                const direction = modelCamera.position.subtract(modelCamera.target);
                                const distance = direction.length();
                                
                                // Calculate new distance based on scroll
                                const scrollDirection = event.deltaY > 0 ? 1 : -1;
                                const newDistance = Math.max(
                                    minDistance,
                                    Math.min(maxDistance, distance + scrollDirection * zoomSpeed)
                                );
                                
                                // Normalize and scale direction
                                const normalizedDirection = direction.normalize();
                                modelCamera.position = modelCamera.target.add(
                                    normalizedDirection.scale(newDistance)
                                );
                            }
                        }, { passive: false });
                    } else {
                        console.log("No model camera found, using fallback");
                    }
                } else {
                    console.log("No cameras in model, using fallback");
                }
                
                // Find the screen mesh
                const screenMesh = loadedScene.meshes.find((mesh: any) => 
                    mesh.name.toLowerCase().includes('screen')
                );
                
                if (screenMesh) {
                    console.log("Screen mesh found:", screenMesh.name);
                    
                    // Create Pong game
                    const pongGame = new PongGame(1024, 1024);
                    const gameCanvas = pongGame.getCanvas();
                    
                    // Force initial draw
                    pongGame.tick();
                    
                    console.log("Game canvas size:", gameCanvas.width, "x", gameCanvas.height);
                    
                    // Create dynamic texture - use internal canvas size
                    const dynamicTexture = new BABYLON.DynamicTexture(
                        "pongTexture",
                        { width: 1024, height: 1024 },
                        scene,
                        false
                    );
                    
                    const ctx = dynamicTexture.getContext();
                    
                    // Initial draw to texture
                    ctx.drawImage(gameCanvas, 0, 0, 1024, 1024);
                    dynamicTexture.update();
                    
                    // Get or create material for the screen
                    let screenMaterial = screenMesh.material as BABYLON.StandardMaterial;
                    
                    if (!screenMaterial || !(screenMaterial instanceof BABYLON.StandardMaterial)) {
                        screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);
                        screenMesh.material = screenMaterial;
                    }
                    
                    // Apply texture to material with strong emissive
                    screenMaterial.diffuseTexture = dynamicTexture;
                    screenMaterial.diffuseColor = new Color3(1, 1, 1);
                    screenMaterial.emissiveTexture = dynamicTexture;
                    screenMaterial.emissiveColor = new Color3(0.9, 0.9, 0.9);
                    screenMaterial.specularColor = new Color3(0, 0, 0);
                    screenMaterial.backFaceCulling = false;
                    
                    // Make sure texture is not inverted
                    dynamicTexture.vScale = -1;
                    
                    console.log("Material applied:", screenMaterial.name);
                    console.log("Pong game started on screen");
                    
                    // Update texture with game canvas on each frame
                    scene.onBeforeRenderObservable.add(() => {
                        pongGame.tick();
                        ctx.drawImage(gameCanvas, 0, 0, 1024, 1024);
                        dynamicTexture.update();
                    });
                    
                    // Space bar to toggle game
                    document.addEventListener('keydown', (e) => {
                        if (e.code === 'Space') {
                            e.preventDefault();
                            pongGame.toggleGame();
                            console.log("Game toggled");
                        }
                    });
                } else {
                    console.warn("Screen mesh not found in the model");
                    // List all mesh names for debugging
                    console.log("Available meshes:", loadedScene.meshes.map((m: any) => m.name));
                }
                
                // Optional: Center and scale the model
                const meshes = loadedScene.meshes;
                if (meshes && meshes.length > 0) {
                    // Calculate bounding box
                    let min = meshes[0].getBoundingInfo().boundingBox.minimumWorld;
                    let max = meshes[0].getBoundingInfo().boundingBox.maximumWorld;
                    
                    for (let i = 1; i < meshes.length; i++) {
                        const meshMin = meshes[i].getBoundingInfo().boundingBox.minimumWorld;
                        const meshMax = meshes[i].getBoundingInfo().boundingBox.maximumWorld;
                        
                        min = Vector3.Minimize(min, meshMin);
                        max = Vector3.Maximize(max, meshMax);
                    }
                    
                    // Calculate center
                    const center = Vector3.Center(min, max);
                    
                    // Move all meshes to center
                    meshes.forEach((mesh: any) => {
                        if (mesh.parent === null) {
                            mesh.position.subtractInPlace(center);
                        }
                    });
                    
                    // Calculate scale factor
                    const size = max.subtract(min);
                    const maxDimension = Math.max(size.x, size.y, size.z);
                    const targetSize = 3; // Desired size
                    const scaleFactor = targetSize / maxDimension;
                    
                    // Scale all root meshes
                    meshes.forEach((mesh: any) => {
                        if (mesh.parent === null) {
                            mesh.scaling.scaleInPlace(scaleFactor);
                        }
                    });
                }
            },
            function (event: any) {
                // Progress callback
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total * 100).toFixed(0);
                    console.log(`Loading progress: ${progress}%`);
                }
            },
            function (scene: any, message: string, exception: any) {
                // Error callback
                console.error("Error loading model:", message, exception);
                
                // Update loading indicator to show error
                if (loadingIndicator) {
                    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Could not load 3DModel.glb</p><p style="font-size: 14px; margin-top: 10px;">Showing fallback sphere instead</p>';
                }
                
                // Create a fallback sphere if model fails to load
                const sphere = BABYLON.MeshBuilder.CreateSphere(
                    "fallbackSphere",
                    { diameter: 2 },
                    scene
                );
                
                const material = new BABYLON.StandardMaterial("sphereMaterial", scene);
                material.diffuseColor = new Color3(0.8, 0.2, 0.2);
                material.specularColor = new Color3(0.5, 0.5, 0.5);
                sphere.material = material;
                
                console.log("Fallback sphere created");
            }
        );
        
        return scene;
    };
    
    // Create the scene
    const scene = createScene();
    
    // Run render loop
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    // Handle window resize
    resizeHandler = () => {
        engine?.resize();
    };
    window.addEventListener('resize', resizeHandler);
}
