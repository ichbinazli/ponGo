import './styles.css';
export declare class ThemeManager {
    private static instance;
    private isDarkMode;
    private toggleButton;
    private moonIcon;
    private sunIcon;
    private constructor();
    static getInstance(): ThemeManager;
    private init;
    private setupTheme;
    private loadThemePreference;
    private saveThemePreference;
    private applyTheme;
    private toggleTheme;
    getCurrentTheme(): 'dark' | 'light';
}
//# sourceMappingURL=main.d.ts.map