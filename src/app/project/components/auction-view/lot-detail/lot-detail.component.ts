import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipe/translate.pipe';
import { TranslateDirective } from '../../../directive/translate.directive';

import { ProcesoCafePipe } from '../../../pipe/proceso-cafe.pipe';
@Component({
  selector: 'app-lot-detail',
  standalone: true,
  // Faltaba TranslateDirective: los appTranslate de la ficha no hacían nada y
  // el modal se quedaba siempre con el texto de respaldo en español.
  imports: [ProcesoCafePipe, CommonModule, TranslateDirective, TranslatePipe],
  templateUrl: './lot-detail.component.html',
  styleUrls: ['./lot-detail.component.scss']
})
export class LotDetailComponent {
  @Input() lot: any = null;
  @Input() lastBids: Map<string, any[]> = new Map();
  /** Con la subasta terminada nada es "actual": son los importes de cierre. */
  @Input() terminada = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  // Método para obtener las pujas del lote actual
  getCurrentBids() {
    return this.lastBids.get(this.lot.coffeeLot.id) || [];
  }

  // Método para formatear nombres de usuario
  getUserDisplayName(user: any): string {
    if (user?.companyName) {
      return user.companyName;
    }
    return `${user?.firstName} ${user?.lastName}`.trim();
  }
}