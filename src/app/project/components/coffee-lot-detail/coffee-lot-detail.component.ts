import { Component, Input } from '@angular/core';
import { HomeService } from '../../../modules/home/home.service';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NewCoffeelotComponent } from '../new-coffeelot/new-coffeelot.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coffee-lot-detail',
  imports: [CommonModule],
  templateUrl: './coffee-lot-detail.component.html',
  styleUrl: './coffee-lot-detail.component.scss',
  providers: [DialogService],
})
export class CoffeeLotDetailComponent {
  @Input() coffeeLotId: string | undefined;
  @Input() Edit: boolean = true;
  ref!: DynamicDialogRef;
  coffeeLot: any;
  loading: boolean = true;
  imageUrls: string[] = [];
  documentUrl: SafeResourceUrl | null = null;
  showDocumentModal: boolean = false;
  documentType: string = '';
  activeImageIndex: number = 0;
  autionActive: any;
  constructor(
    private dialogService: DialogService,
    private service: HomeService,
    private activeRouter: ActivatedRoute
  ) { }

  async ngOnInit() {
   /*  const auction:any = this.activeRouter.snapshot.paramMap.get('id');
    console.log(auction); */
    
    try {

      const [lot] = await Promise.all([
        this.service.getCofeeLot(this.coffeeLotId),
       
      ]);

      this.coffeeLot = lot;
      this.coffeeLot.startingPrice = this.coffeeLot.auctionDetails[0].startingPrice ;
      this.autionActive = this.coffeeLot.auction;

     

    } catch (error) {
      console.error('Error loading coffee lot:', error);
    } finally {
      this.loading = false;
    }
  }

  getFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('msword')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    return 'document';
  }

  openDocumentModal() {
    this.showDocumentModal = true;
  }

  closeDocumentModal() {
    this.showDocumentModal = false;
  }

  getStatusLabel(): string {
    if (this.coffeeLot?.isInAuction) return 'En subasta';
    return this.coffeeLot?.status === 'AVAILABLE' ? 'Disponible' : 'Vendido';
  }

  getStatusClass(): string {
    if (this.coffeeLot?.isInAuction) return 'bg-info-100 text-info-800 border-info-200';
    return this.coffeeLot?.status === 'AVAILABLE' ? 'bg-success-100 text-success-800 border-success-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /*  downloadDocument() {
     if (this.documentUrl) {
       const link = document.createElement('a');
       link.href = this.documentUrl.toString();
       link.target = '_blank';
       link.download = `documento_${this.coffeeLot.name}.${this.documentType}`;
       link.click();
     }
   } */

  addAuction() {
    this.ref = this.dialogService.open(ConfirmModalComponent, {
     /*  header: 'Update Lote de Café', */
      data: {
      title: 'Agregar a Subasta',
      message: '¿Estás seguro de agregar este lote a la subasta activa?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      confirmSeverity: 'success',
      showIcon: true,
      icon: 'check_circle',
      iconColor: 'text-danger-500',
      iconSeverity: 'success'
      },
      showHeader: false,
      baseZIndex: 10000,
      closable: false,
      dismissableMask: true
    });

    this.ref.onClose.subscribe(async(newLot: any) => {
      if (newLot) {
       await this.service.addLotAution({ auctionId: this.autionActive.id, coffeeLotId: this.coffeeLot.id, startingPrice: 10.5})
        /* this.coffeeLots.unshift(newLot); */
        this.ngOnInit();
      }
    });
  }

   removeAuction() {
    this.ref = this.dialogService.open(ConfirmModalComponent, {
     /*  header: 'Update Lote de Café', */
      data: {
      title: 'Quitar de Subasta',
      message: '¿Estás seguro de quitar este lote de la subasta activa?',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      confirmSeverity: 'warn',
      showIcon: true,
      icon: 'error',
      iconColor: 'text-danger-500',
      iconSeverity: 'success'
      },
      showHeader: false,
      baseZIndex: 10000,
      closable: false,
      dismissableMask: true
    });

    this.ref.onClose.subscribe(async(newLot: any) => {
      if (newLot) {
        console.log(this.autionActive,this.coffeeLot);

       await this.service.removeLotAution({ auctionId: this.autionActive.id, coffeeLotId: this.coffeeLot.id})
        /* this.coffeeLots.unshift(newLot); */
        this.ngOnInit();
      }
    });
  }
 

  editLot() {
    this.ref = this.dialogService.open(NewCoffeelotComponent, {
      header: 'Update Lote de Café',
      data: { sellerId: this.coffeeLot.sellerId, data: this.coffeeLot },
      width: 'auto',
      closable: true
    });

    this.ref.onClose.subscribe((newLot: any) => {
      if (newLot) {
        /* this.coffeeLots.unshift(newLot); */
        this.ngOnInit();
      }
    });
  }

    // Nuevos métodos para controlar la visualización de botones
  canEdit(): boolean {
    // Solo se puede editar si no hay subasta activa O si la fecha actual es anterior al inicio de la subasta
  
    if (!this.autionActive) return true;
    
    const now = new Date();
    const startDate = new Date(this.autionActive.startDate);
    return now < startDate;
    
    
  }

  showAuctionButtons(): boolean {
    // Mostrar botones de subasta solo si hay una subasta activa
    return !!this.autionActive;
  }

  showAddButton(): boolean {
    // Mostrar botón de agregar si hay subasta activa y el lote no está en subasta
    return !!this.autionActive && !this.coffeeLot?.isInAuction;
  }

  showRemoveButton(): boolean {
    // Mostrar botón de remover si hay subasta activa y el lote está en subasta
    return !!this.autionActive && !!this.coffeeLot?.isInAuction;
  }

  // Método para obtener la fecha actual en formato comparable
  now(): Date {
    return new Date();
  }
}