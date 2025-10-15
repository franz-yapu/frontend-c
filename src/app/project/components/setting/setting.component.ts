import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EditSettingComponent } from './edit-setting/edit-setting.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ChangeSettingComponent } from './change-setting/change-setting.component';

@Component({
  selector: 'app-setting',
  imports: [CommonModule, DatePipe],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss',
  providers: [DialogService],
})
export class SettingComponent {
ref!: DynamicDialogRef;
 @Input() user: any;
 @Output() reload = new EventEmitter<any>();
constructor(private dialogService: DialogService) { 
 
}

openUserDialog() {
    this.user.roleName=this.user.role.name;
    this.ref = this.dialogService.open(EditSettingComponent, {
      data: { data: this.user},
      header: 'Editar Perfil',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
      if (data) {
       this.reloadData();
      }
    });
  }


  openChangeDialog() {
    this.ref = this.dialogService.open(ChangeSettingComponent, {
      data: { data: this.user},
      header: 'Cambiar Contraseña',
      width: '800px',
      closable: true
    });
    this.ref.onClose.subscribe((data: any) => {
    });
  }

  reloadData() {
    this.reload.emit();
  }

}



