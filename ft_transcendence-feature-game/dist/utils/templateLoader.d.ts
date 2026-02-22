export declare class TemplateLoader {
    private static cache;
    private static readonly TEMPLATE_BASE_PATH;
    static loadTemplate(templateName: string): Promise<string>;
    static clearCache(): void;
    static preloadTemplates(templateNames: string[]): Promise<void>;
}
//# sourceMappingURL=templateLoader.d.ts.map