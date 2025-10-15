import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CategoriesService } from './categories.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GeneralService } from '../../core/gerneral.service';
import { ModalCategoryComponent } from './modal-category/modal-category.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
   providers: [DialogService],
})
export class CategoriesComponent {
  category: any;
  ref!: DynamicDialogRef;

  constructor( private categoriesService: CategoriesService, 
              private dialogService: DialogService,
              private generalService: GeneralService
            ) { }

  ngOnInit(): void {
    this.generalService.show(); // option
    this.loadCategory();
  }

  async loadCategory() {
    this.category = await this.categoriesService.getCategory()
    this.generalService.hide(); // option
  }

  openAddProductModal() {
    this.ref = this.dialogService.open(ModalCategoryComponent, {
      header: 'Nuevo categoria',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      
  
        this.loadCategory()
    
    });
  }

  openEditProductModal(product:any){
    this.ref = this.dialogService.open(ModalCategoryComponent, {
      data: { data: product},
      header: 'actualizar categoria',
      width: '800px',
      closable: true
    });

    this.ref.onClose.subscribe((data: any) => {
      
     
        this.loadCategory()
     
    });
  }

}
