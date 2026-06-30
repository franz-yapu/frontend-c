import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { registerFormFields } from './schema-register';
import { DynamicFormComponent } from '../../../project/components/dynamic-form/dynamic-form.component';
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
  // Modal de éxito tras registrarse (avisa que se envió el correo de confirmación).
  public registered = false;
  public registeredEmail = '';
  constructor(
    private toaster: ToasterService,
    private apiService: ApiService,
    private router: Router,
  ) { }

  async ngOnInit() {
    // getRoles es opcional (el campo de rol está oculto, el registro fuerza
    // BUYER). Si falla, el formulario debe renderizarse igual.
    try {
      const roles: any = await this.apiService.getRoles()
      this.catalogs.roles = (roles || []).map((m: any) => ({
        label: this.roleName(m.name),
        value: m.name,
      }))
    } catch (e) {
      this.catalogs.roles = [];
    }

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

      delete this.formData.data.repeatPassword;
      this.formData.data.roleName = 'BUYER';
      const email = this.formData.data.email;
      if( this.formData.data.companyName === ''){
             delete this.formData.data.companyName;

      }
      this.apiService.register(this.formData.data).then((res: any) => {
        this.disabled= false;
        // Modal visible en vez de toast fugaz + redirección automática: deja
        // claro que hay que confirmar la cuenta por correo antes de loguearse.
        this.registeredEmail = email;
        this.registered = true;

      }).catch((err: any) => {
        // Rehabilitar el botón y avisar: antes un fallo dejaba el form bloqueado
        // sin feedback.
        this.disabled = false;
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error en el registro',
          detail: err?.error?.message || 'No se pudo completar el registro. Intenta de nuevo.',
        });
      });
    }
  }


  home() {
    this.router.navigate(['/']);
  }

  goToLogin() {
    this.registered = false;
    this.router.navigate(['/login']);
  }

  roleName(name: string): string {
  switch (name) {
    case 'ADMIN': return 'Administrador';
    case 'BUYER': return 'Comprador';
    default: return 'Invitado';
  }
}
}