import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormGroup } from '@angular/forms';
import { HomeService } from '../../../modules/home/home.service';
import { ToasterService } from '../../services/toaster.service';
import { ApiService } from '../../services/api.service';
import { lotFormFields } from './lot-schema';
import { environment } from '../../../../environments/environment';
import { GeneralService } from '../../../core/gerneral.service';

@Component({
  selector: 'app-new-coffeelot',
  imports: [CommonModule, DynamicFormComponent],
  templateUrl: './new-coffeelot.component.html',
  styleUrl: './new-coffeelot.component.scss'
})
export class NewCoffeelotComponent implements OnInit {
  dynamicDialogConfig = inject(DynamicDialogConfig);
  formReference!: FormGroup;
  public formData: any;
  onFormCreated = (form: FormGroup) => {
    this.formReference = form;
  };
  initiaData = this.dynamicDialogConfig.data?.data;
  auctionId = this.dynamicDialogConfig.data?.auctionId;
  catalogs: any = {};
  public user: any
  public view= false;
  constructor(
    public ref: DynamicDialogRef,
    private homeSercice: HomeService,
    private toaster: ToasterService,
    private  apiService: ApiService,
    private generalService: GeneralService
  ) { }

  async ngOnInit() {
    this.user = this.generalService.getUser();

    const roles: any = await this.apiService.getUserSellers()
    console.log(roles);
    
    this.catalogs.sellerId = roles.data.map((m: any) => ({
      label: m.firstName +' '+ m.lastName,
      value: m.id,
    }))
    console.log(  this.catalogs);
    this.view = true

    /*  if (this.initiaData) {
       const fileMetadata: any = await this.apiService.getDmsById(this.initiaData.image)
       this.initiaData.image = `${environment.backend}/dms/${fileMetadata.path}`;
       const documents: any = await this.apiService.getDmsById(this.initiaData.documents)
       this.initiaData.documents = `${environment.backend}/dms/${documents.path}`;
 
     } */
    /*  
     */
  }

  PatientsFormFields(catalogs: any): any[] {
    return lotFormFields(catalogs);
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
      /*   const [images, documents] = await Promise.all([
         this.saveFile(this.formData.data.images),
         this.saveFile(this.formData.data.documents)
       ]);
       this.formData.data.images = images.id;
       this.formData.data.documents = documents.id; */
      /* this.formData.data.auctionId = this.auctionId; */
      /* this.formData.data.sellerId = '6c08882b-3c5d-47e3-8b48-45fc8dcb8533'; */
      const startingPrice=this.formData.data.startingPrice;
      delete this.formData.data.startingPrice;
      if (this.initiaData?.id) {
        const lot: any= await this.homeSercice.updateLot(this.initiaData.id, this.formData.data)
         await this.homeSercice.editLotAution(this.initiaData.auctionDetails[0].id,{ auctionId: this.auctionId, coffeeLotId: lot.id, startingPrice: startingPrice})
      this.ref.close(lot);
      } else {

        const lot: any = await this.homeSercice.createLot(this.formData.data)
        console.log(this.formData.data);
        console.log('startingPrice');
        
        await this.homeSercice.addLotAution({ auctionId: this.auctionId, coffeeLotId: lot.id, startingPrice: startingPrice})
        this.toaster.showToast({
          severity: 'success',
          summary: 'Guardado',
          detail: this.initiaData ? 'Los datos se actualizaron correctamente' : 'Los datos se guardaron correctamente',
        });
        this.ref.close(lot);
      }

    } else {
      console.log("no valid");
    }
  }

  close() {
    this.ref.close();
  }

  /* async saveFile(file: any) {
    if (typeof file == 'object') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'documento');
      formData.append('user', this.user.id);
      const r: any = await this.apiService.postDms(formData);
      return r;
    } else {
      return file;
    }

  } */
}