import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipe/translate.pipe';
import { ViewMode } from './view-mode.service';

/**
 * Conmutador tarjetas / tabla, disponible en cualquier tamaño de pantalla.
 *
 * En móvil se queda solo con los iconos (las etiquetas aparecen a partir de
 * `lg`) para que ocupe lo mínimo junto a la búsqueda.
 */
@Component({
  selector: 'app-view-mode-toggle',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center rounded-xl border border-primary/20 bg-surface p-1 shadow-sm"
      role="group" [attr.aria-label]="'AUCTION-BUYER.VIEW_MODE' | translate">
      <button type="button" (click)="elegir('cards')" [attr.aria-pressed]="mode === 'cards'"
        [title]="'AUCTION-BUYER.VIEW_CARDS' | translate"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        [class]="mode === 'cards' ? 'bg-primary text-white' : 'text-content/60 hover:text-primary hover:bg-primary/10'">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
        </svg>
        <span class="hidden lg:inline">{{ 'AUCTION-BUYER.VIEW_CARDS' | translate }}</span>
      </button>
      <button type="button" (click)="elegir('table')" [attr.aria-pressed]="mode === 'table'"
        [title]="'AUCTION-BUYER.VIEW_TABLE' | translate"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
        [class]="mode === 'table' ? 'bg-primary text-white' : 'text-content/60 hover:text-primary hover:bg-primary/10'">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4h14v3H3V4zm0 5h14v2.5H3V9zm0 4.5h14V16H3v-2.5z" />
        </svg>
        <span class="hidden lg:inline">{{ 'AUCTION-BUYER.VIEW_TABLE' | translate }}</span>
      </button>
    </div>
  `,
})
export class ViewModeToggleComponent {
  @Input() mode: ViewMode = 'cards';
  @Output() modeChange = new EventEmitter<ViewMode>();

  elegir(modo: ViewMode): void {
    if (modo !== this.mode) this.modeChange.emit(modo);
  }
}
