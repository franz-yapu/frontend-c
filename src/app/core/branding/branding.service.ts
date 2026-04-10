import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, firstValueFrom, timeout } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface BrandingConfig {
  id?: string;
  primaryColor: string;
  secondaryColor: string;
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  infoColor?: string;
  surfaceColor?: string;
  textColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  emailLogoUrl?: string;
  themeMode: string;
  fontFamily?: string;
  borderRadius?: string;
  isActive?: boolean;
}

const DEFAULT_CONFIG: BrandingConfig = {
  primaryColor: '#CA3636',
  secondaryColor: '#FF9A24',
  successColor: '#10B981',
  warningColor: '#F59E0B',
  dangerColor: '#EF4444',
  infoColor: '#3B82F6',
  surfaceColor: '#FFFFFF',
  textColor: '#1F2937',
  themeMode: 'light',
  fontFamily: 'Inter',
  borderRadius: '4px',
};

const CACHE_KEY = 'branding_config';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly apiUrl = `${environment.backend}/v1/branding`;
  private configSubject = new BehaviorSubject<BrandingConfig>(DEFAULT_CONFIG);
  config$ = this.configSubject.asObservable();
  private configLoaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private httpBackend: HttpBackend
  ) {
    // Cargar desde caché inmediatamente en el constructor para sincronizar el estado Angular
    if (isPlatformBrowser(this.platformId)) {
      const cached = this.getCachedConfig();
      if (cached) {
        console.log('📦 [BRANDING-DIAGNOSTIC] Constructor applying cached config:', cached.primaryColor);
        // No llamamos a applyBranding aquí porque el script de index.html ya lo hizo
        // Pero sí actualizamos el subject para que los componentes lo vean
        this.configSubject.next({ ...DEFAULT_CONFIG, ...cached });
      }
    }
  }

  /** Cargar configuración al iniciar la app (llamar desde APP_INITIALIZER) */
  loadConfig(): Promise<void> {
    if (this.configLoaded) return Promise.resolve();
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    // 1. Intentar cargar desde caché para evitar flicker inicial
    const cached = this.getCachedConfig();
    if (cached) {
      console.log('📦 [BRANDING-DIAGNOSTIC] Applying cached config:', cached.primaryColor);
      this.applyBranding(cached);
      this.configSubject.next(cached);
    }

    const cleanHttp = new HttpClient(this.httpBackend);
    const timestamp = new Date().getTime();
    console.log('📡 [BRANDING-DIAGNOSTIC] Fetching config from server...');

    return firstValueFrom(
      cleanHttp.get<BrandingConfig>(`${this.apiUrl}/config?t=${timestamp}`).pipe(
        timeout(10000), // Aumentar a 10s
        tap((config) => {
          console.log('✅ [BRANDING-DIAGNOSTIC] Received from Server:', config?.primaryColor);
          if (config && config.primaryColor) {
            const safeConfig = { ...DEFAULT_CONFIG, ...config };
            this.applyBranding(safeConfig);
            this.configSubject.next(safeConfig);
            this.setCachedConfig(safeConfig);
            this.configLoaded = true;
          }
        }),
        catchError((err) => {
          console.warn('⚠️ [BRANDING-DIAGNOSTIC] Fetch failed, keeping current/cached state:', err.message);
          // Si falló pero tenemos algo en el subject (del caché), no hacemos nada
          if (!this.configSubject.getValue() || this.configSubject.getValue().primaryColor === DEFAULT_CONFIG.primaryColor) {
             // Solo si no hay nada o es el default, intentamos aplicar algo sensato 
             // Pero si el script de index.html ya lo puso, el subject debería estar actualizado si lo llamamos temprano
          }
          this.configLoaded = true;
          return of(null);
        })
      )
    ).then(() => {
      console.log('🏁 [BRANDING-DIAGNOSTIC] loadConfig flow finished');
    });
  }

  /** Aplicar colores y variables CSS dinámicas al documento */
  applyBranding(config: BrandingConfig): void {
    if (!isPlatformBrowser(this.platformId) || !config) return;

    const root = document.documentElement;

    // Colores con fallbacks de seguridad total
    const primary = config.primaryColor || DEFAULT_CONFIG.primaryColor;
    const secondary = config.secondaryColor || DEFAULT_CONFIG.secondaryColor;

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-color-rgb', this.hexToRgb(primary));
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--secondary-color-rgb', this.hexToRgb(secondary));

    // Colores Semánticos
    const success = config.successColor || DEFAULT_CONFIG.successColor!;
    const warning = config.warningColor || DEFAULT_CONFIG.warningColor!;
    const danger = config.dangerColor || DEFAULT_CONFIG.dangerColor!;
    const info = config.infoColor || DEFAULT_CONFIG.infoColor!;
    const surface = config.surfaceColor || DEFAULT_CONFIG.surfaceColor!;
    const text = config.textColor || DEFAULT_CONFIG.textColor!;

    root.style.setProperty('--success-color', success);
    root.style.setProperty('--success-color-rgb', this.hexToRgb(success));
    root.style.setProperty('--warning-color', warning);
    root.style.setProperty('--warning-color-rgb', this.hexToRgb(warning));
    root.style.setProperty('--danger-color', danger);
    root.style.setProperty('--danger-color-rgb', this.hexToRgb(danger));
    root.style.setProperty('--info-color', info);
    root.style.setProperty('--info-color-rgb', this.hexToRgb(info));
    root.style.setProperty('--surface-color', surface);
    root.style.setProperty('--surface-color-rgb', this.hexToRgb(surface));
    root.style.setProperty('--text-color', text);
    root.style.setProperty('--text-color-rgb', this.hexToRgb(text));

    // Tipografía y bordes
    const fontFamily = config.fontFamily || 'Inter';
    root.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);
    root.style.setProperty('--border-radius', config.borderRadius || '4px');

    // Cargar fuente dinámicamente si no es una de las básicas
    if (isPlatformBrowser(this.platformId) && fontFamily) {
      this.loadGoogleFont(fontFamily);
    }

    // Toggle dark mode
    if (config.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (config.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      }
    }

    // Normalizar URLs de logos (absolutas)
    const baseUrl = environment.backend.replace('/api', '');
    const normalizeUrl = (url?: string) => {
      if (!url) return undefined;
      if (url.startsWith('http') || url.startsWith('data:')) return url;
      return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    };

    config.logoUrl = normalizeUrl(config.logoUrl);
    config.faviconUrl = normalizeUrl(config.faviconUrl);
    config.emailLogoUrl = normalizeUrl(config.emailLogoUrl);

    if (config.faviconUrl) this.updateFavicon(config.faviconUrl);
  }

  private loadGoogleFont(font: string): void {
    const fontId = `google-font-${font.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }

  // ─── ADMIN METHODS ─────────────────────────────────────────────────────────

  createConfig(config: BrandingConfig): Observable<BrandingConfig> {
    return this.http.post<BrandingConfig>(`${this.apiUrl}/config`, config).pipe(
      tap((newConfig) => {
        this.applyBranding(newConfig);
        this.configSubject.next(newConfig);
        this.setCachedConfig(newConfig);
      })
    );
  }

  updateConfig(id: string, config: BrandingConfig): Observable<BrandingConfig> {
    return this.http.put<BrandingConfig>(`${this.apiUrl}/config/${id}`, config).pipe(
      tap((updated) => {
        this.applyBranding(updated);
        this.configSubject.next(updated);
        this.setCachedConfig(updated);
      })
    );
  }

  uploadLogo(id: string, file: File, type: 'main' | 'favicon' | 'email'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.http.post(`${this.apiUrl}/logo/upload/${id}`, formData).pipe(
      tap(() => this.loadConfig()) // Recargar para obtener URLs actualizadas
    );
  }

  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`);
  }

  resetToDefault(): Observable<BrandingConfig> {
    return this.http.post<BrandingConfig>(`${this.apiUrl}/config/reset`, {}).pipe(
      tap((config) => {
        this.applyBranding(config);
        this.configSubject.next(config);
        this.invalidateCache();
      })
    );
  }

  /** Getter para el valor actual */
  get currentConfig(): BrandingConfig {
    return this.configSubject.getValue();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private hexToRgb(hex: string): string {
    if (!hex || typeof hex !== 'string') return '0, 0, 0';
    const cleaned = hex.replace('#', '');
    try {
      if (cleaned.length !== 6 && cleaned.length !== 3) return '0, 0, 0';
      const r = parseInt(cleaned.length === 3 ? cleaned[0] + cleaned[0] : cleaned.substring(0, 2), 16);
      const g = parseInt(cleaned.length === 3 ? cleaned[1] + cleaned[1] : cleaned.substring(2, 4), 16);
      const b = parseInt(cleaned.length === 3 ? cleaned[2] + cleaned[2] : cleaned.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    } catch {
      return '0, 0, 0';
    }
  }

  private updateFavicon(url: string): void {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
      ?? document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    document.head.appendChild(link);
  }

  private getCachedConfig(): BrandingConfig | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { config, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return config;
    } catch {
      return null;
    }
  }

  private setCachedConfig(config: BrandingConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ config, timestamp: Date.now() }));
  }

  private invalidateCache(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(CACHE_KEY);
    }
  }
}
