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
    this.initiaData.endDate = this.formatDateToYMD(new Date(this.initiaData.endDate));
      this.initiaData.startDate = this.formatDateToYMD(new Date(this.initiaData.startDate));
     console.log(this.initiaData);
     
    }
    
    /* const category: any = await this.productService.getCategories()
  
    this.catalogs.category = category.map((res: any) => ({
      label: res.name,
      value: res.id,
    })); */

  }
   private formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      this.formData.data.startDate = this.convertToUTCDate(this.formData.data.startDate)
      this.formData.data.endDate = this.convertToUTCDate(this.formData.data.endDate)
      this.formData.data.minIncrement= parseInt(this.formData.data.minIncrement)
      this.formData.data.adminId = this.user?.id;
      console.log(this.formData);
      
      if (this.initiaData?.id) {

      
        this.service.updateAuctions(this.initiaData.id,this.formData.data).then(res => {
          this.ref.close(res);
        });
      } else {
        this.service.createAuctions(this.formData.data).then(res => {
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

  convertToUTCDate(dateString: any) {

  
    const date = new Date(dateString);
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()+2,
      0, 0, 0, 0
    ));
  
}

  


  close() {
    this.ref.close();
  }
}