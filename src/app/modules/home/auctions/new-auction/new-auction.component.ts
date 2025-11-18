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
    console.log('📝 Datos iniciales:', this.initiaData);
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
      console.log('💾 === INICIANDO GUARDADO ===');
      console.log('📅 Datos del formulario:', this.formData);
      
      // Combinar fecha y hora en un solo campo
      const formData = { ...this.formData.data };
      
      // Combinar startDate + startTime en startDate
      if (formData.startDate && formData.startTime) {
        formData.startDate = this.combineDateAndTimeCORREGIDO(formData.startDate, formData.startTime);
        console.log('📅 StartDate combinado CORREGIDO:', formData.startDate);
        delete formData.startTime;
      }
      
      // Combinar endDate + endTime en endDate
      if (formData.endDate && formData.endTime) {
        formData.endDate = this.combineDateAndTimeCORREGIDO(formData.endDate, formData.endTime);
        console.log('📅 EndDate combinado CORREGIDO:', formData.endDate);
        delete formData.endTime;
      }
      
      // Convertir a UTC
      formData.startDate = this.createUTCDate(formData.startDate);
      formData.endDate = this.createUTCDate(formData.endDate);
      formData.minIncrement = formData.minIncrement;
      formData.adminId = this.user?.id;

      console.log('📅 Datos a enviar al backend:', formData);
      console.log('📅 StartDate (UTC):', formData.startDate);
      console.log('📅 EndDate (UTC):', formData.endDate);
      console.log('💾 === FIN GUARDADO ===');
      
      try {
        if (this.initiaData?.id) {
          await this.service.updateAuctions(this.initiaData.id, formData).then(res => {
            this.toaster.showToast({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Los datos se actualizaron correctamente',
            });
            this.ref.close(res);
          });
        } else {
          await this.service.createAuctions(formData).then(res => {
            this.toaster.showToast({
              severity: 'success',
              summary: 'Guardado',
              detail: 'Los datos se guardaron correctamente',
            });
            this.ref.close(res);
          });
        }
      } catch (error) {
        console.error('❌ Error al guardar:', error);
        this.toaster.showToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al guardar los datos',
        });
      }
    } else {
      console.log("❌ Formulario no válido");
      this.toaster.showToast({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor complete todos los campos requeridos correctamente',
      });
    }
  }

  // ✅ MÉTODO CORREGIDO - Combinar fecha y hora sin cambiar el día
  private combineDateAndTimeCORREGIDO(dateString: string, timeString: string): Date {
    console.log('🔧 COMBINANDO FECHA Y HORA:');
    console.log('📅 DateString recibido:', dateString);
    console.log('⏰ TimeString recibido:', timeString);
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // ✅ SOLUCIÓN: Crear la fecha correctamente sin timezone issues
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Los meses en Date son 0-based
    const day = parseInt(dateParts[2]);
    
    // Crear fecha local explícitamente
    const combinedDate = new Date(year, month, day, hours, minutes, 0, 0);
    
    console.log('📅 Fecha combinada resultante:', combinedDate);
    console.log('📅 Día resultante:', combinedDate.getDate());
    
    return combinedDate;
  }

  // ✅ Crear fecha UTC manteniendo el mismo día
  private createUTCDate(dateInput: any): string {
    const date = new Date(dateInput);
    
    console.log('🔄 CREANDO FECHA UTC:');
    console.log('📅 Fecha local original:', date.toString());
    console.log('📅 Día local:', date.getDate());
    
    // Crear fecha UTC manteniendo EXACTAMENTE el mismo día y hora
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),  // Mismo día
      date.getHours(), // Misma hora
      date.getMinutes(),
      0, 0
    ));
    
    const result = utcDate.toISOString();
    
    console.log('📅 Fecha UTC creada:', result);
    console.log('📅 Día en resultado:', new Date(result).getUTCDate());
    
    return result;
  }

  close() {
    this.ref.close();
  }
}