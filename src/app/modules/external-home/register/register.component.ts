import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { registerFormFields } from './schema-register';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
import { ProductService } from '../../product/product.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { ApiService } from '../../../project/services/api.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';

@Component({
  selector: 'app-register',
  imports: [CommonModule, DynamicFormComponent,TranslateDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData: any
  catalogs: any = {};
  public disabled = false;
  public view = false
  constructor(

    private productService: ProductService,
    private toaster: ToasterService,
    private apiService: ApiService,
    private router: Router,
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
    return registerFormFields(catalogs)
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
   
    if (this.formData?.valid && !this.disabled) {
       this.disabled= true
      delete this.formData.data.phone;
      delete this.formData.data.repeatPassword;
      this.formData.data.roleName = 'BUYER';
      if( this.formData.data.companyName === ''){
             delete this.formData.data.companyName;

      }
      this.apiService.register(this.formData.data).then((res: any) => {
        this.disabled= false;
        this.toaster.showToast({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Usuario registrado correctamente',
        });
        setTimeout(() => {    
        this.router.navigate(['/login']);
        },800); // Espera 2 segundos antes de redirigir
      
      });
    }
  }


  home() {
    this.router.navigate(['/']);
  }

  roleName(name: string): string {
  switch (name) {
    case 'ADMIN': return 'Administrador';
    case 'BUYER': return 'Comprador';
    default: return 'Invitado';
  }
}
}