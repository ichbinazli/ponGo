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
import { I18n } from '../utils/i18n';

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
        
        this.mesh = MeshBuilder.CreatePlane("gamePanel", {
            width: 3.2,
            height: 3.8
        }, this.scene);
        this.mesh.checkCollisions = true;

        this.mesh.position = new Vector3(-4, 4, 0); 
        this.mesh.rotation.y = Math.PI / 8;
        this.mesh.scaling.x = -1;

        this.texture = new DynamicTexture("gamePanelTexture", {
            width: this.width,
            height: this.height
        }, this.scene, false);

        this.texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);

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
        const i18n = I18n.getInstance();
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = '#8e974a';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, this.width - 10, this.height - 10);

        let currentY = 100;

        this.drawText(ctx, i18n.t('gamePanel.gameInfo'), currentY, 48, '#78803a');
        currentY += 80;

        this.drawLabel(ctx, i18n.t('gamePanel.players'), currentY);
        currentY += 50;
        this.drawValue(ctx, `${data.leftPlayer}`, currentY);
        currentY += 50;
        this.drawValue(ctx, `VS`, currentY, 32);
        currentY += 50;
        this.drawValue(ctx, `${data.rightPlayer}`, currentY);
        currentY += 100;

        this.drawLabel(ctx, i18n.t('gamePanel.mode'), currentY);
        currentY += 50;
        this.drawValue(ctx, data.gameMode, currentY);
        currentY += 80;

        this.drawLabel(ctx, i18n.t('gamePanel.winningScore'), currentY);
        currentY += 50;
        this.drawValue(ctx, data.winningScore.toString(), currentY);
        currentY += 100;

        this.drawLabel(ctx, i18n.t('gamePanel.controls'), currentY);
        currentY += 60;
        ctx.textAlign = 'left';
        
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
        ctx.fillStyle = '#a6a6a6';
        ctx.fillText(text, this.width / 2, y);
    }

    private drawValue(ctx: CanvasRenderingContext2D, text: string, y: number, fontSize: number = 42) {
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, this.width / 2, y);
    }

    public dispose(): void {
        this.texture.dispose();
        this.mesh.dispose();
    }
}