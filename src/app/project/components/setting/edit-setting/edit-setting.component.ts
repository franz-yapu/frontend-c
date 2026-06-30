import { Component, inject } from '@angular/core';
import { DynamicFormComponent } from '../../dynamic-form/dynamic-form.component';
import { TranslateDirective } from '../../../directive/translate.directive';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../../../modules/home/home.service';
import { ToasterService } from '../../../services/toaster.service';
import { ApiService } from '../../../services/api.service';
import { userEditFormFields } from './edit-schema';

@Component({
  selector: 'app-edit-setting',
  imports: [CommonModule, DynamicFormComponent, TranslateDirective],
  templateUrl: './edit-setting.component.html',
  styleUrl: './edit-setting.component.scss'
})
export class EditSettingComponent {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};

  constructor(public ref: DynamicDialogRef,
    private homeSercice: HomeService,
    private toaster: ToasterService,
    private apiService: ApiService) { }

  async ngOnInit() {
    const roles: any = await this.apiService.getRoles()
   
    
    this.catalogs.roles = roles.map((m: any) => ({
      label: this.roleName(m.name),
      value: m.name,
    }))
  }

  PatientsFormFields(catalogs: any): any[] {
    return userEditFormFields(catalogs);
  }
async save() {
    if (this.formData?.valid) {
        delete this.formData.data.roleName
        this.apiService.updateUser(this.initiaData.id,this.formData.data).then(res => {
          this.toaster.showToast({
          severity: 'success',
          summary: 'Exito',
          detail: 'Se actualizó el perfil correctamente',
        });
          this.ref.close(res);
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

  roleName(name: string): string {
    switch (name) {
      case 'ADMIN': return 'Administrador';
      case 'BUYER': return 'Comprador';
      case 'SELLER': return 'Productor';
      default: return 'Invitado';
    }
  }
}
