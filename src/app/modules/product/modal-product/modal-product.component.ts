import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { FormGroup } from '@angular/forms';
import { productFormFields } from './schema';
import { ProductService } from '../product.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-modal-product',
  imports: [CommonModule, DynamicFormComponent],
  standalone: true,
  templateUrl: './modal-product.component.html',
  styleUrl: './modal-product.component.scss',

})
export class ModalProductComponent implements OnInit {
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
    private productService: ProductService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    if(this.initiaData){
      const fileMetadata:any = await this.apiService.getDmsById(this.initiaData.file)
      this.initiaData.file = `${environment.backend}/dms/${fileMetadata.path}`;
    }
    const category: any = await this.productService.getCategories()
    const marca:any = await this.productService.getMarca()

    this.catalogs.marca=marca.map((m:any)=>({
      label: m.name,
      value: m.id,
    }))
    this.catalogs.category = category.map((res: any) => ({
      label: res.name,
      value: res.id,
    }));
    this.view = true
  }

  PatientsFormFields(catalogs: any): any[] {
    return productFormFields(catalogs)
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
        const file = await this.saveFile(this.formData.data.file);
        this.formData.data.file = file.id;
        this.productService.updateProducts(this.initiaData.id,this.formData.data).then(res => {
          this.ref.close(res);
        });
      } else {
        const file = await this.saveFile(this.formData.data.file);
        this.formData.data.file = file.id;
        this.productService.createProducts(this.formData.data).then(res => {
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



  async saveFile(file: any) {
    if (typeof file == 'object') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'documento');
      formData.append('user', 'user1');
      const r: any = await this.apiService.postDms(formData);
      return r;
    } else {
      return file;
    }

  }

  


  close() {
    this.ref.close();
  }
}