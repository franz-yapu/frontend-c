// setting.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditSettingComponent } from './edit-setting/edit-setting.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ChangeSettingComponent } from './change-setting/change-setting.component';
import { HttpClient } from '@angular/common/http';
import { HomeService } from '../../../modules/home/home.service';
import { ToasterService } from '../../services/toaster.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TranslateDirective } from '../../directive/translate.directive';


@Component({
  selector: 'app-setting',
  imports: [CommonModule, FormsModule,TranslateDirective],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss',
  providers: [DialogService],
})
export class SettingComponent implements OnInit {
  ref!: DynamicDialogRef;
  @Input() user: any;
  @Output() reload = new EventEmitter<any>();

  // Tabs
  activeTab: 'profile' | 'activity' = 'profile';

  // Activity Logs
  userLogs: any[] = [];
  loadingLogs = false;
  activityFilter = 'all';
  pagination: any;
Math: any;

  constructor(
    private dialogService: DialogService,
    private homeService: HomeService,
    private http: HttpClient,
    private toaster: ToasterService,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
  /*   setTimeout(() => {
      this.loadUserLogs();
    }, 500);
     */
    console.log(this.user);
    
  }

  getTabClass(tab: string): string {
    const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-t-lg border-b-2';
    if (this.activeTab === tab) {
      return `${baseClasses} border-amber-900 text-amber-900 bg-amber-50`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  }

  // Métodos para cargar logs
/* loadUserLogs(page: number = 1) {
  console.log(this.user?.id);
  
  if (!this.user?.id) return;

  console.log('🔄 Loading user logs for user:', this.user.id, 'page:', page);
  
  this.loadingLogs = true;
  const params: any = { page, limit: 10 };
  
  this.homeService.getUserLog(this.user.id, params).then((response: any) => {
    console.log('✅ User logs response:', response);
    
    this.userLogs = response.logs || [];
    this.pagination = response.pagination;
    this.loadingLogs = false;
    
    console.log('📊 Loaded logs:', this.userLogs.length);
    console.log('📄 Pagination:', this.pagination);
  }, (error: any) => {
    console.error('❌ Error loading user logs:', error);
    this.loadingLogs = false;
    this.userLogs = [];
  });
} */

/*   nextPage() {
    if (this.pagination && this.pagination.page < this.pagination.pages) {
      this.loadUserLogs(this.pagination.page + 1);
    }
  } */

/*   getStartIndex(): number {
  if (!this.pagination) return 0;
  return (this.pagination.page - 1) * this.pagination.limit + 1;
}

getEndIndex(): number {
  if (!this.pagination) return 0;
  return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
} */
 /*  previousPage() {
    if (this.pagination && this.pagination.page > 1) {
      this.loadUserLogs(this.pagination.page - 1);
    }
  } */

  getActionBadgeClass(action: string): string {
  const classes: any = {
    'CREATE_TRANSACTION': 'bg-green-100 text-green-800',
    'CREATE_BID': 'bg-blue-100 text-blue-800',
    'CREATE_AUCTION': 'bg-purple-100 text-purple-800',
    'CREATE_COFFEE_LOT': 'bg-amber-100 text-amber-800',
    'USER_REGISTER': 'bg-indigo-100 text-indigo-800',
    'UPDATE_PROFILE': 'bg-emerald-100 text-emerald-800',
  };

  return classes[action] || 'bg-gray-100 text-gray-800';
}

getActionText(action: string): string {
  const actionMap: any = {
    'CREATE_TRANSACTION': 'Transacción',
    'CREATE_BID': 'Puja',
    'CREATE_AUCTION': 'Subasta',
    'CREATE_COFFEE_LOT': 'Lote de Café',
    'USER_REGISTER': 'Registro',
    'UPDATE_PROFILE': 'Actualización',
  };

  return actionMap[action] || action.replace('_', ' ').toLowerCase();
}
// Clase para botones de página
getPageButtonClass(page: number): string {
  const baseClasses = 'px-3 py-2 text-sm font-medium cursor-pointer rounded-md transition-colors';
  if (page === this.pagination.page) {
    return `${baseClasses} bg-amber-900 text-white`;
  }
  return `${baseClasses} text-gray-700 hover:bg-gray-100`;
}


getActionDescription(log: any): string {
  const metadata = log.metadata || {};
  
  switch(log.action) {
    case 'CREATE_TRANSACTION':
      const role = metadata.role === 'BUYER' ? 'Compra' : 'Venta';
      return `${role} realizada`;
    
    case 'CREATE_BID':
      return 'Puja en subasta';
    
    case 'CREATE_AUCTION':
      return 'Subasta creada';
    
    case 'CREATE_COFFEE_LOT':
      return 'Lote registrado';
    
    case 'USER_REGISTER':
      return 'Registro de usuario';
    
    case 'UPDATE_PROFILE':
      return 'Perfil actualizado';
    
    default:
      return log.action.replace('_', ' ').toLowerCase();
  }
}

  // Métodos existentes
  openUserDialog() {
    this.user.roleName = this.user.role.name;
    this.ref = this.dialogService.open(EditSettingComponent, {
      data: { data: this.user },
      header: 'Editar Perfil',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
        this.reloadData();
        // Log automático de actualización
        /* this.logUserAction('UPDATE_PROFILE', 'PROFILE'); */
      }
    });
  }

  openChangeDialog() {
    this.ref = this.dialogService.open(ChangeSettingComponent, {
      data: { data: this.user },
      header: 'Cambiar Contraseña',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      /* if (data) {
        this.logUserAction('UPDATE_PASSWORD', 'PROFILE');
      } */
    });
  }

  reloadData() {
    this.reload.emit();
  }

  private logUserAction(action: string, module: string) {
    // Aquí puedes llamar al servicio para registrar la acción
    this.http.post('/api/user-logs', {
      userId: this.user.id,
      action,
      module
    }).subscribe();
  }

  getActionIcon(action: string): string {
  const icons: any = {
    'CREATE_TRANSACTION': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    'CREATE_BID': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'CREATE_AUCTION': 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
    'CREATE_COFFEE_LOT': 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    'USER_REGISTER': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    'UPDATE_PROFILE': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };

  return icons[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
}

getActionIconClass(action: string): string {
  const classes: any = {
    'CREATE_TRANSACTION': 'bg-green-500',
    'CREATE_BID': 'bg-blue-500',
    'CREATE_AUCTION': 'bg-purple-500',
    'CREATE_COFFEE_LOT': 'bg-amber-500',
    'USER_REGISTER': 'bg-indigo-500',
    'UPDATE_PROFILE': 'bg-emerald-500',
  };

  return classes[action] || 'bg-gray-500';
}

// Mejora getTimeAgo para ser más compacto
getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

hasAdditionalInfo(log: any): boolean {
  return log.metadata && (log.metadata.amount || log.metadata.status);
}

getStatusClass(status: string): string {
  const classes: any = {
    'COMPLETED': 'text-green-600',
    'PENDING': 'text-yellow-600',
    'CANCELLED': 'text-red-600',
  };
  return classes[status] || 'text-gray-600';
}

getStatusText(status: string): string {
  const statusMap: any = {
    'COMPLETED': 'Completado',
    'PENDING': 'Pendiente',
    'CANCELLED': 'Cancelado',
  };
  return statusMap[status] || status;
}

getPageNumbers(): number[] {
  if (!this.pagination) return [];
  
  const pages = [];
  const currentPage = this.pagination.page;
  const totalPages = this.pagination.pages;
  
  // Mostrar máximo 5 páginas alrededor de la actual
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  // Ajustar si estamos cerca del inicio
  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  
  // Ajustar si estamos cerca del final
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
}

 

  activateUser() {
    this.ref = this.dialogService.open(ConfirmModalComponent, {
      data: {
        title: this.user.isVerified ?  'Desactivar Usuario':'Activar Usuario' ,
        message: this.user.isVerified ?  '¿Estás seguro de que deseas desactivar al usuario?':'¿Estás seguro de que deseas activar al usuario?' ,
        confirmText: this.user.isVerified ?  'Desactivar':'Activar',
        cancelText: 'Cancelar',
        confirmSeverity: this.user.isVerified ? 'warning':  'success',
        showIcon: true,
        icon: this.user.isVerified ?  'block':'check_circle',
        iconColor: 'text-red-500',
        iconSeverity: 'success'
      },
      showHeader: false,
      baseZIndex: 10000,
      closable: false,
      dismissableMask: true
    });

    this.ref.onClose.subscribe( (action: any) => {
      if (action) {
        
        this.user.isVerified=!this.user.isVerified;
        const data ={
          isVerified : this.user.isVerified,
          id: this.user.id
         }

        this.apiService.updateUser(this.user.id,data).then(res => {
          this.toaster.showToast({
          severity: 'success',
          summary: 'Exito',
          detail: 'Se actualizó el perfil correctamente',
        });

        });
      }
    });
  }

  deleteUser() {
     this.ref = this.dialogService.open(ConfirmModalComponent, {
      /*  header: 'Update Lote de Café', */
      data: {
        title: 'Eliminar Usuario',
        message: '¿Estás seguro de que deseas eliminar al usuario definitivamente? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmSeverity: 'danger',
        showIcon: true,
        icon: 'delete',
        iconColor: 'text-red-500',
        iconSeverity: 'success'
      },
      showHeader: false,
      baseZIndex: 10000,
      closable: false,
      dismissableMask: true
    });

    this.ref.onClose.subscribe(async (action: any) => {
      if (action) {
        const data = this.homeService.deleteUser(this.user?.id).then(res => {
          this.toaster.showToast({
            severity: 'success',
            summary: 'Eliminado',
            detail: 'El usuario se eliminó correctamente',
          });
           this.router.navigate(['/home/users']);
        }).catch(err => {
          this.toaster.showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el usuario tiene datos asociados',
          });
        });
        // Llamar al servicio para eliminar
      }
      
    });
  }

 
}