import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
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
  institutionName?: string;
  institutionShortName?: string;
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
  institutionName: 'Cáritas Bolivia',
  institutionShortName: 'Cáritas',
};

const CACHE_KEY = 'branding_config';
// TTL corto: el cache solo evita el flicker inicial; el valor del servidor manda.
// Con 60s la ventana de "color viejo" en una sesión nueva es mínima.
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly apiUrl = `${environment.backend}/v1/branding`;
  private configSubject = new BehaviorSubject<BrandingConfig>(DEFAULT_CONFIG);
  config$ = this.configSubject.asObservable();
  // Angular signal for reactive computed() in components
  readonly configSignal = signal<BrandingConfig>(DEFAULT_CONFIG);
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
        const merged = { ...DEFAULT_CONFIG, ...cached };
        this.pushConfig(merged);
      }

      // Sincronización entre pestañas: si el admin guarda branding en otra pestaña,
      // el cache de localStorage cambia y aquí re-aplicamos al instante (sin refrescar).
      window.addEventListener('storage', (e) => {
        if (e.key !== CACHE_KEY || !e.newValue) return;
        try {
          const { config } = JSON.parse(e.newValue);
          if (config) {
            const merged = { ...DEFAULT_CONFIG, ...config };
            this.applyBranding(merged);
            this.pushConfig(merged);
          }
        } catch {
          /* valor corrupto: se ignora, el servidor corregirá en el próximo fetch */
        }
      });
    }
  }

  /** Cargar configuración al iniciar la app (llamar desde APP_INITIALIZER) */
  loadConfig(): Promise<void> {
    if (this.configLoaded) return Promise.resolve();
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    // 1. Intentar cargar desde caché para evitar flicker inicial
    const cached = this.getCachedConfig();
    if (cached) {
      this.applyBranding(cached);
      this.pushConfig(cached);
    }

    // 2. Siempre traer el valor fresco del servidor (cache-bust con ?t=) y aplicarlo:
    // así una carga normal de la sección externa refleja los últimos colores/textos.
    const cleanHttp = new HttpClient(this.httpBackend);
    const timestamp = new Date().getTime();

    return firstValueFrom(
      cleanHttp.get<BrandingConfig>(`${this.apiUrl}/config?t=${timestamp}`).pipe(
        timeout(4000), // Tope del arranque: ya se aplicó caché antes, no bloquear más de 4s
        tap((config) => {
          if (config && config.primaryColor) {
            const safeConfig = { ...DEFAULT_CONFIG, ...config };
            this.applyBranding(safeConfig);
            this.pushConfig(safeConfig);
            this.setCachedConfig(safeConfig);
            this.configLoaded = true;
          }
        }),
        catchError(() => {
          // Si el servidor no responde, conservamos el cache ya aplicado (sin romper la UI).
          this.configLoaded = true;
          return of(null);
        })
      )
    ).then(() => undefined);
  }

  /** Aplicar colores y variables CSS dinámicas al documento */
  applyBranding(config: BrandingConfig): void {
    if (!isPlatformBrowser(this.platformId) || !config) return;

    const root = document.documentElement;

    // Colores con fallbacks de seguridad total. Si un color viene null, vacío o
    // con formato inválido (#GGG, "rojo", etc.) se usa el default: así un valor
    // corrupto NUNCA puede dejar la UI en negro ni romper las opacidades Tailwind.
    const primary = this.safeColor(config.primaryColor, DEFAULT_CONFIG.primaryColor);
    const secondary = this.safeColor(config.secondaryColor, DEFAULT_CONFIG.secondaryColor);

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-color-rgb', this.hexToRgb(primary));
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--secondary-color-rgb', this.hexToRgb(secondary));

    // Colores Semánticos
    const success = this.safeColor(config.successColor, DEFAULT_CONFIG.successColor!);
    const warning = this.safeColor(config.warningColor, DEFAULT_CONFIG.warningColor!);
    const danger = this.safeColor(config.dangerColor, DEFAULT_CONFIG.dangerColor!);
    const info = this.safeColor(config.infoColor, DEFAULT_CONFIG.infoColor!);
    const surface = this.safeColor(config.surfaceColor, DEFAULT_CONFIG.surfaceColor!);
    const text = this.safeColor(config.textColor, DEFAULT_CONFIG.textColor!);

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
    // Solo inyectamos fuentes de la lista blanca: evita cargar recursos de
    // terceros arbitrarios desde un fontFamily manipulado.
    if (!BrandingService.ALLOWED_FONTS.has(font)) return;
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
        this.pushConfig(newConfig);
        this.setCachedConfig(newConfig);
      })
    );
  }

  updateConfig(id: string, config: BrandingConfig): Observable<BrandingConfig> {
    return this.http.put<BrandingConfig>(`${this.apiUrl}/config/${id}`, config).pipe(
      tap((updated) => {
        this.applyBranding(updated);
        this.pushConfig(updated);
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
        this.pushConfig(config);
        this.invalidateCache();
      })
    );
  }

  /** Getter para el valor actual */
  get currentConfig(): BrandingConfig {
    return this.configSubject.getValue();
  }

  /** Sync both BehaviorSubject and Angular signal */
  private pushConfig(config: BrandingConfig): void {
    this.configSubject.next(config);
    this.configSignal.set(config);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  // Regex hex (3 o 6 dígitos) — misma validación que el backend.
  private static readonly HEX_RE = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  // Fuentes permitidas (las mismas que ofrece el panel admin). Solo estas se
  // inyectan desde Google Fonts; cualquier otro valor cae al fallback CSS.
  private static readonly ALLOWED_FONTS = new Set([
    'Inter', 'Roboto', 'Outfit', 'Poppins', 'Open Sans', 'Lato', 'Montserrat',
  ]);

  /** Devuelve `value` solo si es un hex válido; si no, el fallback (default). */
  private safeColor(value: string | undefined, fallback: string): string {
    return value && BrandingService.HEX_RE.test(value) ? value : fallback;
  }

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
