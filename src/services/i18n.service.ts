import { hu } from '../locales/hu';
import { en } from '../locales/en';

type Locale = 'hu' | 'en';
type Translations = typeof hu;

class I18nService {
  private currentLocale: Locale = 'hu'; // Default to Hungarian
  private translations: Record<Locale, Translations> = {
    hu,
    en
  };

  constructor() {
    // Try to detect browser language or use saved preference
    const savedLocale = localStorage.getItem('app_locale') as Locale;
    if (savedLocale && (savedLocale === 'hu' || savedLocale === 'en')) {
      this.currentLocale = savedLocale;
    } else {
        // Default to Hungarian as requested
        this.currentLocale = 'hu';
    }
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public setLocale(locale: Locale): void {
    this.currentLocale = locale;
    localStorage.setItem('app_locale', locale);
    window.location.reload(); // Simple reload to apply changes
  }

  public t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLocale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        console.warn(`Missing translation for key: ${key}`);
        return key; // Return key if not found
      }
    }

    if (typeof value === 'string' && params) {
      return Object.keys(params).reduce((acc, paramKey) => {
        return acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
      }, value);
    }

    return value as string;
  }

  public translatePage(): void {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        element.textContent = this.t(key);
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key) {
        (element as HTMLInputElement | HTMLTextAreaElement).placeholder = this.t(key);
      }
    });
  }
}

export const i18nService = new I18nService();
