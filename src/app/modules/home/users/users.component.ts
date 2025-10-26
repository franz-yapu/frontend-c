import { Component, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { on } from 'events';
import { ActionButton, SortDirection, TableColumn, TableComponent } from '../../../project/components/table/table.component';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { UserModalComponent } from './user-modal/user-modal.component';
import { ToasterService } from '../../../project/services/toaster.service';
import { ConfirmModalComponent } from '../../../project/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-users',
  imports: [TableComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  providers: [DialogService],
})
export class UsersComponent implements OnInit {
  ref!: DynamicDialogRef;
  users: any[] = []; // Reemplaza 'any' con tu interfaz User
  totalUsers = 0;
  currentPage = 1;
  actionButtons: ActionButton[] = [
    {
      label: 'Nuevo Usuario',
      icon: 'add',
      action: 'create',
      color: 'secondary'
    }
  ];
  columns: TableColumn[] = [
    { key: 'firstName', label: 'Nombre', sortable: true },
    { key: 'lastName', label: 'Apellidos', sortable: true },
    { key: 'email', label: 'Correo electronico', sortable: true },
    { key: 'companyName', label: 'Empresa o Asociación', sortable: true },
    {
      key: 'createdAt',
      label: 'Fecha Registro',
      sortable: true,
      format: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'roleId',
      label: 'Role',
      sortable: true,
      format: (value) => this.roleName(value)
    }
  ];

  constructor(private homeService: HomeService, private router: Router, private dialogService: DialogService, private toaster: ToasterService) {
  }

  ngOnInit(): void {
    this.homeService.getUsers().then(users => {
      this.users = users as any[];
      console.log(users);
      // Aquí puedes manejar la respuesta de los usuarios
    }).catch(error => {
      console.error('Error fetching users:', error);
    });
  }



  onPageChange(page: number) {
    this.currentPage = page;
    // Carga los datos para la nueva página
  }

  onRowClick(user: any) {
    this.router.navigate(['/home/user', user.id]);
  }

  onTableAction(event: { action: string, item?: any }) {
    console.log('Acción de tabla:', event.action, 'Elemento:', event?.item);
    switch (event.action) {
      case 'create':
        this.openCreateUserDialog();
        break;
    }
  }

  onReloadData() {
    this.ngOnInit();
  }

  openCreateUserDialog() {
    this.ref = this.dialogService.open(UserModalComponent, {
      header: 'Nuevo Usuario',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      console.log(data);

      if (data) {
        console.log(data);

        this.router.navigate(['/home/user', data?.user?.id]);
      }


    });
  }


  roleName(name: string): string {
    switch (name) {
      case '0a973799-b889-489a-84ac-3d4e5c8af31a': return 'Administrador';
      case 'd36ad33e-64ab-43df-8b17-49d0f2f328cd': return 'Comprador';
      case '58005159-2d57-4db9-aa4a-34bf3f5b20ff': return 'Productor';
      default: return 'Invitado';
    }
  }


  // En el componente padre
  async onToggleStatus(event: { item: any, newStatus: boolean }) {

     this.ref = this.dialogService.open(ConfirmModalComponent, {
      /*  header: 'Update Lote de Café', */
      data: {
        title: event.newStatus ? 'Activar Usuario' : 'Desactivar Usuario',
        message: event.newStatus ? '¿Estás seguro de que deseas activar al usuario?' : '¿Estás seguro de que deseas desactivar al usuario?',
        confirmText: event.newStatus ? 'Activar' : 'Desactivar',
        cancelText: 'Cancelar',
        confirmSeverity: event.newStatus ? 'success' : 'warning',
        showIcon: true,
        icon: event.newStatus ? 'check_circle' : 'block',
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
         console.log('Cambiar estado:', event.item, 'Nuevo estado:', event.newStatus);
          event.item.isVerified=!event.item.isVerified;
      const data = await this.homeService.updateStatusUser(event.item)
      this.toaster.showToast({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Los datos se actualizaron correctamente',
      });
      this.ngOnInit();
      }
       this.ngOnInit();
    });


  }

  onDeleteUser(user: any) {

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
        const data = this.homeService.deleteUser(user.id).then(res => {
          this.toaster.showToast({
            severity: 'success',
            summary: 'Eliminado',
            detail: 'El usuario se eliminó correctamente',
          });
          this.ngOnInit();
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
