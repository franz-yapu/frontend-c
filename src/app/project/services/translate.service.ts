import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiBase = `${environment.backend}/v1/translations`;

  private availableLanguages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  private currentLang = signal<string>('es');
  private translations = signal<Translation>({});
  // Overrides editados desde el admin (mapa plano "NAV.HOME" -> texto). Tienen
  // prioridad sobre el JSON base, así el admin puede cambiar cualquier palabra.
  private overrides = signal<Record<string, string>>({});

  // Asegúrate de que esta propiedad exista
  public languages = computed(() => this.availableLanguages);
  public currentLanguage = computed(() => this.currentLang());

  constructor() {
    // Idioma inicial: el guardado (solo en browser) o español por defecto.
    const savedLang = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('preferred-language')
      : null;
    const initial =
      savedLang && this.availableLanguages.some((l) => l.code === savedLang)
        ? savedLang
        : 'es';
    this.loadTranslations(initial);
  }

  private loadTranslations(lang: string): void {
    this.http.get<Translation>(`/assets/i18n/${lang}.json`).subscribe({
      next: (translations) => {
        this.translations.set(translations);
        this.currentLang.set(lang);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('preferred-language', lang);
        }
        this.loadOverrides(lang);
      },
      error: () => {
        console.error(`Failed to load translations for ${lang}`);
        // Fallback a español
        if (lang !== 'es') {
          this.loadTranslations('es');
        }
      },
    });
  }

  /** Carga del backend los textos editados por el admin para `lang`. */
  private loadOverrides(lang: string): void {
    // En SSR no llamamos al backend: se usan los textos base del JSON.
    if (!isPlatformBrowser(this.platformId)) {
      this.overrides.set({});
      return;
    }
    this.http.get<Record<string, string>>(`${this.apiBase}/${lang}`).subscribe({
      next: (ov) => this.overrides.set(ov || {}),
      // Si el backend no responde, no rompemos nada: quedan los textos base.
      error: () => this.overrides.set({}),
    });
  }

  useLanguage(lang: string): void {
    if (this.availableLanguages.some((l) => l.code === lang)) {
      this.loadTranslations(lang);
    }
  }

  /** Recarga textos base + overrides del idioma actual (tras editar en admin). */
  reloadCurrent(): void {
    this.loadTranslations(this.currentLang());
  }

  translate(key: string, params?: { [key: string]: string }): string {
    let result: string;

    // 1) Override del admin (prioridad total sobre el JSON base).
    const override = this.overrides()[key];
    if (override !== undefined) {
      result = override;
    } else {
      // 2) Texto base anidado del JSON.
      const keys = key.split('.');
      let value: any = this.translations();
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          return key; // Fallback a la clave
        }
      }
      result = typeof value === 'string' ? value : key;
    }

    // Reemplazar parámetros si existen
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(`{{${paramKey}}}`, params[paramKey]);
      });
    }

    return result;
  }

  getCurrentLanguageInfo(): Language {
    return (
      this.availableLanguages.find(
        (lang) => lang.code === this.currentLanguage(),
      ) || this.availableLanguages[0]
    );
  }
}
