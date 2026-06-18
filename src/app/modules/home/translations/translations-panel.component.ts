import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import {
  TranslationAdminService,
  LocaleMap,
} from './translation-admin.service';
import { TranslationService } from '../../../project/services/translate.service';

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
    <div class="p-4 md:p-6 max-w-6xl mx-auto">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 class="text-2xl font-bold">Textos de la plataforma</h1>
          <p class="text-sm text-gray-500">
            Edita cualquier palabra del sistema. Vacío = usar el texto por defecto.
          </p>
        </div>
        <button
          class="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
          [style.background]="'var(--primary-color)'"
          [disabled]="saving || dirtyCount === 0"
          (click)="save()"
        >
          {{ saving ? 'Guardando…' : 'Guardar (' + dirtyCount + ')' }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-3">
        <input
          type="text"
          [(ngModel)]="search"
          placeholder="Buscar por clave o texto…"
          class="flex-1 min-w-[200px] border rounded-lg px-3 py-2"
        />
        <label class="flex items-center gap-2 text-sm select-none">
          <input type="checkbox" [(ngModel)]="onlyOverridden" />
          Solo modificados
        </label>
        <span class="text-sm text-gray-500"
          >{{ filteredRows.length }} / {{ rows.length }}</span
        >
      </div>

      <div *ngIf="okMsg" class="mb-3 text-green-700 bg-green-50 px-3 py-2 rounded">
        {{ okMsg }}
      </div>
      <div *ngIf="error" class="mb-3 text-red-700 bg-red-50 px-3 py-2 rounded">
        {{ error }}
      </div>

      <div *ngIf="loading" class="py-10 text-center text-gray-500">Cargando…</div>

      <div *ngIf="!loading" class="overflow-x-auto border rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-3 py-2 w-1/4">Clave</th>
              <th class="px-3 py-2">Español</th>
              <th class="px-3 py-2">English</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let r of filteredRows; trackBy: trackKey"
              class="border-t align-top"
              [class.bg-amber-50]="r.es !== r.initEs || r.en !== r.initEn"
            >
              <td class="px-3 py-2 font-mono text-xs text-gray-600 break-all">
                {{ r.key }}
              </td>
              <td class="px-3 py-2">
                <input
                  type="text"
                  [(ngModel)]="r.es"
                  [placeholder]="r.baseEs"
                  class="w-full border rounded px-2 py-1"
                />
              </td>
              <td class="px-3 py-2">
                <input
                  type="text"
                  [(ngModel)]="r.en"
                  [placeholder]="r.baseEn"
                  class="w-full border rounded px-2 py-1"
                />
              </td>
              <td class="px-3 py-2 text-center">
                <button
                  *ngIf="r.es || r.en"
                  title="Resetear a texto por defecto"
                  class="text-gray-400 hover:text-red-600"
                  (click)="resetRow(r)"
                >
                  ↺
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class TranslationsPanelComponent implements OnInit {
  private admin = inject(TranslationAdminService);
  private i18n = inject(TranslationService);
  readonly locales = ['es', 'en'];

  rows: Row[] = [];
  loading = true;
  saving = false;
  error = '';
  okMsg = '';
  search = '';
  onlyOverridden = false;

  ngOnInit(): void {
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
      error: () => {
        this.saving = false;
        this.error = 'No se pudieron guardar los textos.';
      },
    });
  }
}
