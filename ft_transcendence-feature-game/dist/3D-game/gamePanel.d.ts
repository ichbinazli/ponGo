import { Scene } from '@babylonjs/core';
export interface GamePanelData {
    leftPlayer: string;
    rightPlayer: string;
    gameMode: string;
    winningScore: number;
    controls: string[];
}
export declare class GamePanel {
    private scene;
    private mesh;
    private texture;
    private width;
    private height;
    constructor(scene: Scene);
    update(data: GamePanelData): void;
    private drawText;
    private drawLabel;
    private drawValue;
    dispose(): void;
}
//# sourceMappingURL=gamePanel.d.ts.map