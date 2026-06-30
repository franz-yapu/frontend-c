import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import {
  TranslationAdminService,
  LocaleMap,
} from './translation-admin.service';
import { TranslationService } from '../../../project/services/translate.service';
import { GeneralService } from '../../../core/gerneral.service';

interface Row {
  key: string;
  baseEs: string;
  baseEn: string;
  es: string; // override editable (o '' = usar base)
  en: string;
  initEs: string; // snapshot inicial del override
  initEn: string;
}

@Component({
  selector: 'app-translations-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Barra superior fija -->
      <header class="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-10 h-10 rounded-xl text-white shrink-0"
                  [style.background]="'var(--primary-color)'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M3 10h12M3 15h7M17 8l4 4-4 4" />
              </svg>
            </span>
            <div>
              <h1 class="text-lg font-semibold text-slate-800 leading-tight">Textos de la plataforma</h1>
              <p class="text-xs text-slate-500">Edita cualquier palabra del sistema · vacío = usar el texto por defecto</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            @if (dirtyCount > 0) {
              <span class="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {{ dirtyCount }} sin guardar
              </span>
            }
            <button
              class="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-60 flex items-center gap-2"
              [style.background]="'var(--primary-color)'"
              [disabled]="saving || dirtyCount === 0"
              (click)="save()">
              @if (saving) {
                <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Guardando…
              } @else {
                Guardar cambios
              }
            </button>
          </div>
        </div>
      </header>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <!-- Aviso de sesión: guardar exige ADMIN autenticado -->
        @if (!isAdmin) {
          <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
            <span class="text-lg leading-none">🔒</span>
            <div>
              <p class="font-semibold">No tienes una sesión de administrador activa.</p>
              <p class="text-amber-700">
                @if (!hasToken) {
                  No hay sesión iniciada. Entra con <b>admin&#64;cafe.test</b> / <b>sample</b> para guardar textos.
                } @else {
                  Tu sesión es de rol <b>{{ sessionRole || 'desconocido' }}</b>, no ADMIN. Los cambios no se guardarán.
                }
              </p>
            </div>
          </div>
        }

        <!-- Avisos -->
        @if (okMsg) {
          <div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg">{{ okMsg }}</div>
        }
        @if (error) {
          <div class="text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{{ error }}</div>
        }

        <!-- Toolbar de búsqueda -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[220px]">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path stroke-linecap="round" d="m20 20-3-3" />
            </svg>
            <input type="text" [(ngModel)]="search" placeholder="Buscar por clave o texto…"
              class="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2" />
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
            <input type="checkbox" [(ngModel)]="onlyOverridden" class="rounded accent-slate-700" />
            Solo modificados
          </label>
          <span class="text-xs text-slate-400 ml-auto">{{ filteredRows.length }} de {{ rows.length }} claves</span>
        </div>

        <!-- Estado de carga -->
        @if (loading) {
          <div class="py-16 flex flex-col items-center gap-3 text-slate-400">
            <span class="w-7 h-7 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></span>
            <span class="text-sm">Cargando textos…</span>
          </div>
        } @else if (filteredRows.length === 0) {
          <div class="py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            No hay textos que coincidan con el filtro.
          </div>
        } @else {
          <!-- Tabla -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-[60px] bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3 w-1/4 font-semibold">Clave</th>
                    <th class="px-4 py-3 font-semibold">Español 🇪🇸</th>
                    <th class="px-4 py-3 font-semibold">English 🇺🇸</th>
                    <th class="px-3 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of filteredRows; track r.key) {
                    <tr class="border-t border-slate-100 align-top transition-colors"
                        [class.bg-amber-50]="r.es !== r.initEs || r.en !== r.initEn">
                      <td class="px-4 py-3">
                        <span class="font-mono text-xs text-slate-500 break-all">{{ r.key }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <input type="text" [(ngModel)]="r.es" [placeholder]="r.baseEs"
                          class="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 placeholder:text-slate-300" />
                      </td>
                      <td class="px-4 py-3">
                        <input type="text" [(ngModel)]="r.en" [placeholder]="r.baseEn"
                          class="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 placeholder:text-slate-300" />
                      </td>
                      <td class="px-3 py-3 text-center">
                        @if (r.es || r.en) {
                          <button title="Resetear al texto por defecto"
                            class="w-7 h-7 grid place-items-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            (click)="resetRow(r)">↺</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TranslationsPanelComponent implements OnInit {
  private admin = inject(TranslationAdminService);
  private i18n = inject(TranslationService);
  private session = inject(GeneralService);
  readonly locales = ['es', 'en'];

  rows: Row[] = [];
  loading = true;
  saving = false;
  error = '';
  okMsg = '';
  search = '';
  onlyOverridden = false;

  // Estado de sesión (guardar exige ADMIN).
  hasToken = false;
  sessionRole: string | null = null;
  get isAdmin(): boolean {
    return this.hasToken && this.sessionRole === 'ADMIN';
  }

  ngOnInit(): void {
    this.hasToken = !!this.session.getToken();
    this.sessionRole = this.session.getUser()?.role?.name ?? null;
    this.load();
  }

  trackKey = (_: number, r: Row) => r.key;

  load(): void {
    this.loading = true;
    this.error = '';
    this.admin.loadAll(this.locales).subscribe({
      next: ({ base, overrides }) => {
        const baseEs = base['es'] || {};
        const baseEn = base['en'] || {};
        const ovEs = overrides['es'] || {};
        const ovEn = overrides['en'] || {};
        const keys = Array.from(
          new Set([
            ...Object.keys(baseEs),
            ...Object.keys(baseEn),
            ...Object.keys(ovEs),
            ...Object.keys(ovEn),
          ]),
        ).sort();
        this.rows = keys.map((key) => ({
          key,
          baseEs: baseEs[key] ?? '',
          baseEn: baseEn[key] ?? '',
          es: ovEs[key] ?? '',
          en: ovEn[key] ?? '',
          initEs: ovEs[key] ?? '',
          initEn: ovEn[key] ?? '',
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los textos.';
        this.loading = false;
      },
    });
  }

  get filteredRows(): Row[] {
    const q = this.search.trim().toLowerCase();
    return this.rows.filter((r) => {
      if (this.onlyOverridden && !r.es && !r.en) return false;
      if (!q) return true;
      return (
        r.key.toLowerCase().includes(q) ||
        r.baseEs.toLowerCase().includes(q) ||
        r.baseEn.toLowerCase().includes(q)
      );
    });
  }

  get dirtyCount(): number {
    return this.rows.filter((r) => r.es !== r.initEs || r.en !== r.initEn).length;
  }

  resetRow(r: Row): void {
    r.es = '';
    r.en = '';
  }

  save(): void {
    const changedEs: LocaleMap = {};
    const changedEn: LocaleMap = {};
    for (const r of this.rows) {
      if (r.es !== r.initEs) changedEs[r.key] = r.es;
      if (r.en !== r.initEn) changedEn[r.key] = r.en;
    }

    this.saving = true;
    this.error = '';
    this.okMsg = '';
    forkJoin({
      es: Object.keys(changedEs).length
        ? this.admin.save('es', changedEs)
        : of(null),
      en: Object.keys(changedEn).length
        ? this.admin.save('en', changedEn)
        : of(null),
    }).subscribe({
      next: () => {
        // Consolidar el snapshot: lo guardado pasa a ser el nuevo "inicial".
        for (const r of this.rows) {
          r.initEs = r.es;
          r.initEn = r.en;
        }
        this.saving = false;
        this.okMsg = 'Textos guardados.';
        // Refrescar el i18n en vivo para ver los cambios al instante.
        this.i18n.reloadCurrent();
      },
      error: (err) => {
        this.saving = false;
        const status = err?.status;
        if (status === 401) {
          this.error = 'Sesión inválida o expirada (401). Cierra sesión y entra de nuevo como admin.';
        } else if (status === 403) {
          this.error = 'Tu usuario no es ADMIN (403). Inicia sesión con una cuenta de administrador.';
        } else if (status === 0) {
          this.error = 'No se pudo contactar al servidor (¿backend en localhost:3010?).';
        } else {
          this.error = 'No se pudieron guardar los textos' + (status ? ` (HTTP ${status})` : '') + '.';
        }
      },
    });
  }
}
