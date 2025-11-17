import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../../../../project/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { HomeService } from '../../home.service';
import { ToasterService } from '../../../../project/services/toaster.service';
import { auctionFormFields } from './new-auction-schema';
import { GeneralService } from '../../../../core/gerneral.service';

@Component({
  selector: 'app-new-auction',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './new-auction.component.html',
  styleUrl: './new-auction.component.scss'
})
export class NewAuctionComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  catalogs: any = {};
  user: any;
   
  constructor(
    public ref: DynamicDialogRef,
    private service: HomeService,
    private toaster: ToasterService,
    private generalService: GeneralService
  ) { }

 async ngOnInit() {
  this.user = this.generalService.getUser();
  console.log(this.user);
  console.log(this.initiaData);
  
  if(this.initiaData){
    // Separar fecha y hora de los datos existentes para la edición
    const startDate = new Date(this.initiaData.startDate);
    const endDate = new Date(this.initiaData.endDate);
    
    this.initiaData = {
      ...this.initiaData,
      startDate: this.formatDateToYMD(startDate),
      startTime: this.formatTime(startDate),
      endDate: this.formatDateToYMD(endDate),
      endTime: this.formatTime(endDate)
    };
    
    console.log(this.initiaData);
  }
}

  private formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  PatientsFormFields(catalogs: any): any[] {
    return auctionFormFields(catalogs)
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
    console.log('Datos del formulario:', this.formData);
    
    // Combinar fecha y hora en un solo campo
    const formData = { ...this.formData.data };
    
    // Combinar startDate + startTime en startDate
    if (formData.startDate && formData.startTime) {
      formData.startDate = this.combineDateAndTime(formData.startDate, formData.startTime);
      // Eliminar el campo startTime ya que no debe enviarse
      delete formData.startTime;
    }
    
    // Combinar endDate + endTime en endDate
    if (formData.endDate && formData.endTime) {
      formData.endDate = this.combineDateAndTime(formData.endDate, formData.endTime);
      // Eliminar el campo endTime ya que no debe enviarse
      delete formData.endTime;
    }
    
    // Convertir a UTC
    formData.startDate = this.convertToUTCDate(formData.startDate);
    formData.endDate = this.convertToUTCDate(formData.endDate);
    formData.minIncrement = formData.minIncrement;
    formData.adminId = this.user?.id;

    console.log('Datos a guardar:', formData);
    
    if (this.initiaData?.id) {
      this.service.updateAuctions(this.initiaData.id, formData).then(res => {
        this.ref.close(res);
      });
    } else {
      this.service.createAuctions(formData).then(res => {
        this.toaster.showToast({
          severity: 'success',
          summary: 'Guardado',
          detail: this.initiaData ? 'Los datos se actualizaron correctamente' : 'Los datos se guardaron correctamente',
        });
        this.ref.close(res);
      });
    }
  } else {
    console.log("Formulario no válido");
  }
}

private combineDateAndTime(dateString: string, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(dateString);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

convertToUTCDate(dateInput: any): Date {
  const date = new Date(dateInput);
  
  // Sumar 4 horas para compensar la diferencia
  date.setHours(date.getHours() + 4);
  
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0, 0
  ));
}

  

  close() {
    this.ref.close();
  }
}