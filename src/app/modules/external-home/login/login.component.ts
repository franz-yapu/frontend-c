import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';


import { CommonModule } from '@angular/common';
import { ApiService } from '../../../project/services/api.service';
import { ToasterService } from '../../../project/services/toaster.service';
import { GeneralService } from '../../../core/gerneral.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { BrandingService } from '../../../core/branding/branding.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,TranslateDirective, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private brandingService = inject(BrandingService);
  public branding$ = this.brandingService.config$;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  private auth = inject(GeneralService);
  private token: string | null = null;
  public tokenVerified: boolean = false;

  // Mostrar/ocultar contraseña (mismo patrón de ojito que dynamic-form).
  public showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toaster: ToasterService,
  ) { }

  ngOnInit() {
    // Verificar si hay token en los query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;

      if (this.token) {
        this.verifyToken(this.token);
      }
    });
  }

   async verifyToken(token: string) {
   
    try {
      const res:any = await this.apiService.verifyRegistrationToken(token);
      
      if (res.confirm) {
        this.tokenVerified = true;
        this.showSuccessPopup(res.message || '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.');
        
        // Limpiar el token de la URL para evitar que se reintente la verificación
        this.router.navigate([], {
          queryParams: { token: null },
          queryParamsHandling: 'merge'
        });
      } else {
        this.showErrorPopup(res.message || 'Error al verificar la cuenta');
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      this.showErrorPopup(error?.error?.message || 'Error al verificar el token');
    } finally {
   
    }
  }

  showSuccessPopup(message: string) {
    this.toaster.showToast({
      severity: 'success',
      summary: 'Verificación Exitosa',
      detail: message,
    });
  }

  showErrorPopup(message: string) {
    this.toaster.showToast({
      severity: 'error',
      summary: 'Error de Verificación',
      detail: message,
    });
  }

   onSubmit() {
  this.loginForm.markAllAsTouched();

  if (this.loginForm.valid) {

    const { email, password } = this.loginForm.value;
    
    this.apiService.login({email: email!, password: password!}).subscribe({
      next: (res) => {

        if (res.access_token) {
          const user = this.auth.getUser();
          
          this.toaster.showToast({
            severity: 'success',
            summary: '¡Inicio de sesión exitoso!',
            detail: `Bienvenido ${user?.firstName || ''} al sistema`,
          });

          this.redirectByRole(user?.role?.name);
        }
      },
      error: (err) => {
    
        
        const errorCode = err.error?.code;
        const errorMessage = err.error?.message || 'Ocurrió un error al intentar iniciar sesión';
        const status = err.status;

        switch (errorCode) {
          case 'INVALID_CREDENTIALS':
            this.toaster.showToast({
              severity: 'error',
              summary: 'Credenciales incorrectas',
              detail: 'El email o contraseña son incorrectos',
            });
            break;
            
          case 'ACCOUNT_NOT_VERIFIED':

            this.toaster.showToast({
              severity: 'info',
              summary: 'Cuenta no verificada',
              detail: errorMessage,
              life: 10000,
            });
            break;

          case 'ACCOUNT_DISABLED':
            this.toaster.showToast({
              severity: 'warning',
              summary: 'Cuenta desactivada',
              detail: errorMessage,
              life: 10000,
            });
            break;

          default:
            // Manejar por status code como fallback
            if (status === 401) {
              this.toaster.showToast({
                severity: 'error',
                summary: 'Credenciales incorrectas',
                detail: 'El email o contraseña son incorrectos',
              });
            } else {
              this.toaster.showToast({
                severity: 'error',
                summary: 'Error en el servidor',
                detail: errorMessage,
              });
            }
        }
      }
    });
  }
}

redirectByRole(role: string) {
  console.log(role);
  
  if (role === 'ADMIN') {
    this.router.navigate(['/home']);
  } else if (role === 'BUYER') {
    this.router.navigate(['/buyer']);
  } else {
    this.router.navigate(['/']);
  }

}

regulation() {
    this.router.navigate(['/regulation']);
}
}