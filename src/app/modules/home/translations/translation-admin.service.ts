import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type LocaleMap = Record<string, string>;
export type OverridesByLocale = Record<string, LocaleMap>;

/** Servicio de administración de textos i18n (solo panel admin). */
@Injectable({ providedIn: 'root' })
export class TranslationAdminService {
  private http = inject(HttpClient);
  private apiBase = `${environment.backend}/v1/translations`;

  /** Aplana un JSON anidado a claves con puntos: {NAV:{HOME:'x'}} -> {'NAV.HOME':'x'}. */
  static flatten(obj: any, prefix = ''): LocaleMap {
    const out: LocaleMap = {};
    for (const k of Object.keys(obj || {})) {
      const full = prefix ? `${prefix}.${k}` : k;
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, TranslationAdminService.flatten(v, full));
      } else {
        out[full] = v == null ? '' : String(v);
      }
    }
    return out;
  }

  /** Carga los textos BASE (JSON de assets) de un idioma, aplanados.
   *  Si el JSON falla, devuelve {} para no tumbar la carga completa. */
  getBase(locale: string): Observable<LocaleMap> {
    return this.http.get<any>(`/assets/i18n/${locale}.json`).pipe(
      map((json) => TranslationAdminService.flatten(json)),
      catchError(() => of({} as LocaleMap)),
    );
  }

  /** Carga base + overrides de todos los idiomas en una sola llamada combinada.
   *  Cada fuente degrada de forma independiente: si el endpoint de overrides
   *  falla (p. ej. sesión no-admin), el editor igual muestra los textos base
   *  en vez de quedar en blanco con error. */
  loadAll(locales: string[]): Observable<{
    base: OverridesByLocale;
    overrides: OverridesByLocale;
  }> {
    const baseCalls: Record<string, Observable<LocaleMap>> = {};
    locales.forEach((l) => (baseCalls[l] = this.getBase(l)));
    return forkJoin({
      base: forkJoin(baseCalls),
      overrides: this.http
        .get<OverridesByLocale>(`${this.apiBase}`)
        .pipe(catchError(() => of({} as OverridesByLocale))),
    });
  }

  /** Guarda (upsert masivo) los textos de un idioma. Valor vacío = resetear. */
  save(locale: string, overrides: LocaleMap): Observable<LocaleMap> {
    return this.http.put<LocaleMap>(`${this.apiBase}/${locale}`, { overrides });
  }
}
