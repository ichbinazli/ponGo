export type Language = 'tr' | 'en' | 'fr' | 'de';
export declare class I18n {
    private static instance;
    private currentLanguage;
    private constructor();
    static getInstance(): I18n;
    /** Get translated string by key */
    t(key: string): string;
    /** Get current language */
    getLanguage(): Language;
    /** Set language and persist */
    setLanguage(lang: Language): void;
    /** Load saved language from localStorage */
    private loadLanguage;
    /**
     * Walk through all elements with data-i18n and translate them.
     * Supports:
     *   data-i18n="key"              → sets textContent
     *   data-i18n-placeholder="key"  → sets placeholder attribute
     *   data-i18n-title="key"        → sets title attribute
     */
    applyTranslations(): void;
}
//# sourceMappingURL=i18n.d.ts.map