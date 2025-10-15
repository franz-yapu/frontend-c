import { Component } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { ModalProductComponent } from './modal-product/modal-product.component';
import { ProductService } from './product.service';
import { GeneralService } from '../../core/gerneral.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
  providers: [DialogService],
})
export class ProductComponent {
  products: any;
  ref!: DynamicDialogRef;

  constructor( private productService: ProductService, 
              private dialogService: DialogService,
              private generalService: GeneralService
            ) { }

  ngOnInit(): void {
    this.generalService.show(); // option
    this.loadProducts();
  }

  async loadProducts() {
    this.products = await this.productService.getProducts()
    this.generalService.hide(); // option
  }

  openAddProductModal() {
    this.ref = this.dialogService.open(ModalProductComponent, {
      header: 'Nuevo Producto',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      
  
        this.loadProducts()
    
    });
  }

  openEditProductModal(product:any){
    this.ref = this.dialogService.open(ModalProductComponent, {
      data: { data: product},
      header: 'Nuevo Producto',
      width: '800px',
      closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      
     
        this.loadProducts()
     
    });
  }

}
