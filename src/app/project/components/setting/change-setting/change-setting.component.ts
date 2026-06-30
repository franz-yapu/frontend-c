import { Component, inject } from '@angular/core';
import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToasterService } from '../../../services/toaster.service';
import { changeFormFields } from './change-schema';

@Component({
  selector: 'app-change-setting',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './change-setting.component.html',
  styleUrl: './change-setting.component.scss'
})
export class ChangeSettingComponent {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};

  constructor(public ref: DynamicDialogRef,
    private toaster: ToasterService,
    private apiService: ApiService) { }

  async ngOnInit() {
  
  }

  PatientsFormFields(catalogs: any): any[] {
    return changeFormFields(catalogs);
  }
async save() {
    if (this.formData?.valid) {
       // El form usa la key 'password' (para activar la confirmación del
       // DynamicForm); el backend espera 'newPassword'. Se mapea y se descartan
       // los campos auxiliares antes de enviar.
       const payload = {
         userId: this.initiaData.id,
         currentPassword: this.formData.data.currentPassword,
         newPassword: this.formData.data.password,
       };
        this.apiService.changePassword(payload).then(res => {
          this.ref.close(res);
          this.toaster.showToast({
          severity: 'success',
          summary: 'Exito',
          detail: 'Se realizó el cambio de contraseña correctamente',
        });
        }).catch(err => {
          this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Contraseña actual incorrecta',
        });
        });

    }else {
        console.log("no valid");
    }
  }

  close() {
    this.ref.close();
  }

  handleFormChange(event: {
    data: any;
    valid: boolean;
    touched: boolean;
    dirty: boolean;
    complete: boolean;
  }) {

    this.formData = event;
  }


}