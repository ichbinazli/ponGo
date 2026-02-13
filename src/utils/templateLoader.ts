export class TemplateLoader {
    private static cache: Map<string, string> = new Map();
    private static readonly TEMPLATE_BASE_PATH = '/frontend';

    static async loadTemplate(templateName: string): Promise<string> {
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName)!;
        }

        try {
            const response = await fetch(`${this.TEMPLATE_BASE_PATH}/${templateName}.html`);
            
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templateName}`);
            }

            const content = await response.text();
            
            this.cache.set(templateName, content);
            
            return content;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            throw error;
        }
    }

    static clearCache(): void {
        this.cache.clear();
    }

    static async preloadTemplates(templateNames: string[]): Promise<void> {
        const promises = templateNames.map(name => 
            this.loadTemplate(name).catch(err => {
                console.error(`Failed to preload template ${name}:`, err);
            })
        );
        
        await Promise.all(promises);
    }
}