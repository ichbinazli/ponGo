import {
    Scene,
    MeshBuilder,
    Mesh,
    DynamicTexture,
    StandardMaterial,
    Color3,
    Vector3,
    Texture
} from '@babylonjs/core';

export interface GamePanelData {
    leftPlayer: string;
    rightPlayer: string;
    gameMode: string;
    winningScore: number;
    controls: string[];
}

export class GamePanel {
    private scene: Scene;
    private mesh: Mesh;
    private texture: DynamicTexture;
    private width = 512;
    private height = 1024;

    constructor(scene: Scene) {
        this.scene = scene;
        
        // Create Mesh
        this.mesh = MeshBuilder.CreatePlane("gamePanel", {
            width: 3.2,
            height: 3.8
        }, this.scene);
        this.mesh.checkCollisions = true;

        // Position - moved it closer and adjusted height
        this.mesh.position = new Vector3(-4, 4, 0); 
        this.mesh.rotation.y = Math.PI / 8; // Tilted slightly towards center/camera if on left
        this.mesh.scaling.x = -1; // Mirror horizontally to fix text direction

        // Create Texture
        this.texture = new DynamicTexture("gamePanelTexture", {
            width: this.width,
            height: this.height
        }, this.scene, false); // generateMipMaps = false

        // Pixel Art Settings
        this.texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);

        // Create Material
        const material = new StandardMaterial("gamePanelMat", this.scene);
        material.diffuseTexture = this.texture;
        material.emissiveTexture = this.texture;
        material.emissiveColor = Color3.White();
        material.specularColor = Color3.Black();
        material.disableLighting = true;
        material.backFaceCulling = false;

        this.mesh.material = material;
    }

    public update(data: GamePanelData): void {
        const ctx = this.texture.getContext() as CanvasRenderingContext2D;
        
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        // Border
        ctx.strokeStyle = '#8e974a';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, this.width - 10, this.height - 10);

        let currentY = 100;

         // Title
        this.drawText(ctx, "GAME INFO", currentY, 48, '#78803a');
        currentY += 80;

        // Players Section
        this.drawLabel(ctx, "PLAYERS", currentY);
        currentY += 50;
        this.drawValue(ctx, `${data.leftPlayer}`, currentY);
        currentY += 50;
        this.drawValue(ctx, `VS`, currentY, 32);
        currentY += 50;
        this.drawValue(ctx, `${data.rightPlayer}`, currentY);
        currentY += 100;

        // Mode Section
        this.drawLabel(ctx, "MODE", currentY);
        currentY += 50;
        this.drawValue(ctx, data.gameMode, currentY);
        currentY += 80;

        // Winning Score
        this.drawLabel(ctx, "WINNING SCORE", currentY);
        currentY += 50;
        this.drawValue(ctx, data.winningScore.toString(), currentY);
        currentY += 100;

        // Controls
        this.drawLabel(ctx, "CONTROLS", currentY);
        currentY += 60;
        ctx.textAlign = 'left';
        
        // Calculate starting X roughly to center multiline text block visually
        const startX = 60; 
        
        data.controls.forEach((control) => {
             ctx.font = `bold 28px monospace`;
             ctx.fillStyle = '#ffffff';
             ctx.fillText(control, startX, currentY);
             currentY += 40;
        });

        this.texture.update();
    }

    private drawText(ctx: CanvasRenderingContext2D, text: string, y: number, fontSize: number, color: string) {
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(text, this.width / 2, y);
    }

    private drawLabel(ctx: CanvasRenderingContext2D, text: string, y: number) {
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#a6a6a6'; // Light Grey
        ctx.fillText(text, this.width / 2, y);
    }

    private drawValue(ctx: CanvasRenderingContext2D, text: string, y: number, fontSize: number = 42) {
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff'; // White
        ctx.fillText(text, this.width / 2, y);
    }

    public dispose(): void {
        this.texture.dispose();
        this.mesh.dispose();
    }
}