import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BuyerService } from '../buyer.service';
import { GeneralService } from '../../../core/gerneral.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';


@Component({
  selector: 'app-buyer-orders',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './buyer-orders.component.html',
  styleUrls: ['./buyer-orders.component.scss']
})
export class BuyerOrdersComponent implements OnInit {
  public userId: any;
  public data: any[] = [];

  constructor(
    private buyerService: BuyerService,
    private generalService: GeneralService
  ) { }

  async ngOnInit() {
    const dataUser: any = this.generalService.getUser();
    this.userId = dataUser.id;
    console.log('User ID:', this.userId);

    this.buyerService.getOrders(this.userId).subscribe(res => {
      // Asegurar IDs únicos y limpiar datos
      this.data = this.ensureUniqueIds(res);
      console.log(res);
      
      console.log('Transacciones procesadas:', this.data);
    });
  }

  // Función para asegurar IDs únicos
  private ensureUniqueIds(transactions: any[]): any[] {
    return transactions.map((tx: any, index: number) => ({
      ...tx,
      // Crear ID único si está duplicado o es undefined
      uniqueId: tx.id ? `tx-${tx.id}-${index}` : `tx-${Date.now()}-${index}`,
      showBids: false,
      auction: {
        ...tx.auction,
        bids: tx.auction.bids.map((bid: any, bidIndex: number) => ({
          ...bid,
          // Crear ID único para cada puja
          uniqueId: bid.id ? `bid-${bid.id}-${index}-${bidIndex}` : `bid-${Date.now()}-${index}-${bidIndex}`
        }))
      }
    }));
  }

  // Función para trackBy de transacciones
  getTxTrackBy(tx: any, index: number): string {
    return tx.uniqueId || `tx-${index}`;
  }

  // Función para trackBy de pujas
  getBidTrackBy(bid: any, index: number): string {
    return bid.uniqueId || `bid-${index}`;
  }

  // Función para toggle de pujas (manejo inmutable)
  toggleBids(tx: any): void {
    const updatedTx = {
      ...tx,
      showBids: !tx.showBids
    };
    
    this.data = this.data.map(item => 
      item.uniqueId === tx.uniqueId ? updatedTx : item
    );
  }

  // Función para ver detalle de la transacción
  verDetalle(tx: any) {
    console.log('Ver detalle de:', tx);
    // Aquí puedes abrir modal o navegar a otra página
  }
}