import { Component, inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CategoriesService } from '../categories.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { categoryFormFields } from './schema-category';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-category',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './modal-category.component.html',
  styleUrl: './modal-category.component.scss'
})
export class ModalCategoryComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  public view = false
  constructor(
    public ref: DynamicDialogRef,
    private categoriesService: CategoriesService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    this.catalogs.CRISTAL=[{label:"varon", value :'1'},{label:"varon", value :'2'},{label:"varon", value :'3'}]
   
    
   this.view= true;
  }

  PatientsFormFields(catalogs: any): any[] {
    return categoryFormFields(catalogs)
    
  }


  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {
    /*   console.log('Datos:', event.data);
      console.log('¿Válido?', event.valid);
      console.log('¿Tocado?', event.touched);
      console.log('¿Modificado?', event.dirty);
      console.log('¿Completo?', event.complete); */
    this.formData = event;
  }

  async save() {
    if (this.formData?.valid) {
      if (this.initiaData?.id) {
        
        this.categoriesService.updateCategory(this.initiaData.id,this.formData.data).then(res => {
          this.ref.close(res);
        });
      } else {
      
        this.categoriesService.createCategory(this.formData.data).then(res => {
          this.toaster.showToast({
            severity: 'success',
            summary: 'Guardado',
            detail: this.initiaData ? 'Los datos se actualizaron correctamente' : 'Los datos se guardaron correctamente',
          });
          this.ref.close(res);
        });

      }

    }else {
        console.log("no valid");
    }
  }




  close() {
    this.ref.close();
  }
}