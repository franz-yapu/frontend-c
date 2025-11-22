import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);

  private availableLanguages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  private currentLang = signal<string>('es');
  private translations = signal<Translation>({});

  // Asegúrate de que esta propiedad exista
  public languages = computed(() => this.availableLanguages);
  public currentLanguage = computed(() => this.currentLang());

  constructor() {
    this.loadTranslations('es');
    
    // Cargar idioma guardado
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && this.availableLanguages.some(l => l.code === savedLang)) {
      this.loadTranslations(savedLang);
    }
  }

  private loadTranslations(lang: string): void {
    this.http.get<Translation>(`./assets/i18n/${lang}.json`).subscribe({
      next: (translations) => {
        this.translations.set(translations);
        this.currentLang.set(lang);
        localStorage.setItem('preferred-language', lang);
      },
      error: () => {
        console.error(`Failed to load translations for ${lang}`);
        // Fallback a español
        if (lang !== 'es') {
          this.loadTranslations('es');
        }
      }
    });
  }

  useLanguage(lang: string): void {
    if (this.availableLanguages.some(l => l.code === lang)) {
      this.loadTranslations(lang);
    }
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return key; // Fallback a la clave
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  getCurrentLanguageInfo(): Language {
    return this.availableLanguages.find(lang => lang.code === this.currentLanguage()) || this.availableLanguages[0];
  }
}