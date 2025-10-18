import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lot-detail.component.html',
  styleUrls: ['./lot-detail.component.scss']
})
export class LotDetailComponent {
  @Input() lot: any = null;
  @Input() lastBids: Map<string, any[]> = new Map();
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