import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GeneralService } from '../../core/gerneral.service';
import { ApiService } from '../../project/services/api.service';
import { Router } from '@angular/router';
import { ToasterService } from '../../project/services/toaster.service';
import { DynamicFormComponent } from '../../project/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { productFormFields } from '../product/modal-product/schema';
import { environment } from '../../../environments/environment';
import { ProductService } from '../product/product.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { registerFormFields } from './schema-register';

@Component({
  selector: 'app-register',
  imports: [CommonModule, DynamicFormComponent],
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
  public view = false
  
  // Variables para el modal
  public showSuccessModal = false;
  public registeredEmail = '';
  public valid=true;
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
    this.formData = event;
  }

  async save() {
    this.valid=false;
    if (this.formData?.valid) {
      // Guardar el email para mostrarlo en el modal
      this.registeredEmail = this.formData.data.email;
      
      delete this.formData.data.phone;
      delete this.formData.data.repeatPassword;
      this.formData.data.roleName = 'BUYER';
      
      if(this.formData.data.companyName === '') {
        delete this.formData.data.companyName;
      }
      
      this.apiService.register(this.formData.data).then((res: any) => {
        this.toaster.showToast({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Usuario registrado correctamente',
        });
        
        // Mostrar el modal en lugar de redirigir inmediatamente
        this.showSuccessModal = true;
        this.valid=true;
      }).catch((error: any) => {
        console.error('Error en el registro:', error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Hubo un problema al registrar el usuario',
        });
      });
    }
  }

  // Método para cerrar el modal y redirigir
  closeModal() {
    this.showSuccessModal = false;
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 300);
  }

  home() {
    this.router.navigate(['/']);
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