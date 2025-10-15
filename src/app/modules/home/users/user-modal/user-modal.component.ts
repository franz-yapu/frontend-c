import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HomeService } from '../../home.service';
import { ToasterService } from '../../../../project/services/toaster.service';
import { ApiService } from '../../../../project/services/api.service';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DynamicFormComponent } from '../../../../project/components/dynamic-form/dynamic-form.component';
import { userFormFields } from './user-schema';

@Component({
  selector: 'app-user-modal',
  imports: [CommonModule,DynamicFormComponent],
  templateUrl: './user-modal.component.html',
  styleUrl: './user-modal.component.scss'
})
export class UserModalComponent implements OnInit {
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
    private homeSercice: HomeService,
    private toaster: ToasterService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
     const roles: any = await this.apiService.getRoles()
    this.catalogs.roles = roles.map((m: any) => ({
      label: this.roleName(m.name),
      value: m.name,
    }))
    this.view = true
  }

  PatientsFormFields(catalogs: any): any[] {
    return  userFormFields(catalogs) ; 
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

  async save() {
    if (this.formData?.valid) {
      
      if (this.initiaData?.id) {
   
        this.apiService.updateUser(this.initiaData.id,this.formData.data).then(res => {
          this.ref.close(res);
        });
      } else {
        if( this.formData.data.companyName == null || this.formData.data.companyName == undefined){
             delete this.formData.data.companyName;
       }
    
        this.apiService.register(this.formData.data).then((res:any) => {
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

  roleName(name: string): string {
  switch (name) {
    case 'ADMIN': return 'Administrador';
    case 'BUYER': return 'Comprador';
    case 'SELLER': return 'Productor';
    default: return 'Invitado';
  }
}
}