import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { TranslateDirective } from '../../directive/translate.directive';
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
  imports: [CommonModule, DynamicFormComponent, TranslateDirective],
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
  public view = false;

  // Datos predefinidos basados en la información que proporcionaste
 private predefinedData: any = {
  varieties: [
     'Geisha', 'Castillo', 'Pacamara', 'IPR-103', 'Starmaya',
    'Java', 'Catuai rojo', 'Catuai amarillo', 'Tipica', 'Mondonovo',
    'COIPSA 01', 'Caturra', 'Catimor', 'Criollo', 'Híbrido',
    'Bourbon', 'Maragogipe', 'Pacas', 'Villa sarchi', 'Sl28',
    'Obatá', 'Parainema', 'Icatu', 'Centroamericano', 'Catisic'
  ],

  processes: [
    'Lavado', 'Natural', 'Honey',
    'Semi-lavado', 'Anaeróbico', 'Fermentación prolongada', 'Carbonic maceration'
  ],

  dryingSystems: [
    'Mesa', 'Patio', 'Cama africana', 'Guardiola', 'Secadora mecánica',
    'Silo', 'Parihuela', 'Invernadero solar', 'Toldo', 'Malla suspendida'
  ],

  countries: [
    'Bolivia'
  ],

  regions: [
    'La Paz', 'Santa Cruz', 'Cochabamba',
    'Beni', 'Pando'
  ],

  provinces: [
    'Caranavi', 'Coroico', 'Guanay', 'Teoponte', 'Mairana', 'Comarapa', 'Villa Tunari',
    'Sud Yungas', 'Nor Yungas', 'Inquisivi', 'Ichilo', 'Chapare'
  ],

  municipalities: [
    'Caranavi', 'Coroico', 'Guanay', 'Teoponte', 'Mairana', 'Comarapa',
    'Villa Tunari', 'Bolinda', 'Villa El Carmen', 'Unión Progreso',
    '10 De Febrero', 'Santa Ana', 'Loma Orcon', 'Illimani A', 'Cerro Verde',
    'Villa Asunción', 'Tocaña', 'San Juan', 'Tres Arroyos', 'Santa Rosita de Suapi',
    'San Antonio de Bolinda', 'San Mateo', 'Manco Capak', 'Villa Caturapi',
    'Oro Verde', 'San Pablo', 'Incapampa', 'Corobaya', 'Piedra Mesa',
    '1ra. Zona San Isidro', 'Santa Barbara', 'Gualberto Villarroel',
    'Huarinilla', 'San Pedro de La Loma', 'Corocoro Viejo', 'Incacapa',
    'Palos Blancos', 'Alto Beni', 'Irupana', 'Chulumani', 'La Asunta',
    'Yanacachi', 'Tipuani', 'Mapiri', 'Sapecho', 'Quiabaya', 'Ixiamas'
  ],

  communities: [
    'Bolinda', 'Villa El Carmen', 'Unión Progreso', '10 De Febrero',
    'Santa Ana', 'Loma Orcon', 'Illimani A', 'Cerro Verde', 'Villa Asunción',
    'Tocaña', 'San Juan', 'Tres Arroyos', 'Santa Rosita de Suapi','3ra. Llusta',
    'San Antonio de Bolinda', 'San Mateo', 'Manco Capak', 'Villa Caturapi',
    'Oro Verde', 'San Pablo', 'Incapampa', 'Corobaya','Copacabana ', 'Piedra Mesa',
    '1ra. Zona San Isidro', 'Santa Barbara', 'Gualberto Villarroel',
    'Huarinilla', 'San Pedro de La Loma', 'Corocoro Viejo', 'Incacapa',
    'Uchumachi', 'San José de Uchumachi', 'Carmen Pampa', 'San Lorenzo',
    'Taipiplaya', 'San Pedro de Sapecho', 'Alto Sajama', 'Pelechuco',
    'San Miguel de Huachi', 'San Cristóbal', 'Sapecho', 'Río Colorado',
    'Yolosita', 'Inicua', 'Cañamina', 'Río Selva', 'San Pablo de Tiquina'
  ]
};

  constructor(
    public ref: DynamicDialogRef,
    private homeSercice: HomeService,
    private toaster: ToasterService,
    private apiService: ApiService,
    private generalService: GeneralService
  ) { }

  async ngOnInit() {
    this.user = this.generalService.getUser();

    // Cargar datos predefinidos en los catálogos
    this.loadPredefinedCatalogs();

    const roles: any = await this.apiService.getUserSellers()
    console.log(roles);
    
    this.catalogs.sellerId = roles.data.map((m: any) => ({
      label: m.firstName + ' ' + m.lastName,
      value: m.id,
    }));

    // Cargar datos existentes si estamos editando
    if (this.initiaData) {
      await this.loadExistingData();
    }

    console.log(this.catalogs);
    this.view = true;
  }

  private loadPredefinedCatalogs() {
    // Convertir arrays de strings a formato {label, value}
    Object.keys(this.predefinedData).forEach(key => {
      this.catalogs[key] = this.predefinedData[key].map((item: string) => ({
        label: this.capitalizeFirstLetter(item),
        value: item
      }));
    });
  }

private async loadExistingData() {
  // Si estamos editando, agregar los valores existentes a los catálogos
  const fieldsToCheck = [
    'variety', 'process', 'dryingSystem', 'country', 
    'region', 'province', 'municipality', 'community'
  ];

  fieldsToCheck.forEach(field => {
    const catalogKey = field + 's';
    const catalog = this.catalogs[catalogKey];
    
    // Verificar que el catálogo exista y sea un array
    if (catalog && Array.isArray(catalog)) {
      if (this.initiaData[field] && !catalog.some((item: any) => 
          item.value.toLowerCase() === this.initiaData[field].toLowerCase())) {
        
        catalog.unshift({
          label: this.capitalizeFirstLetter(this.initiaData[field]),
          value: this.initiaData[field]
        });
      }
    } else {
      console.warn(`Catálogo ${catalogKey} no encontrado o no es un array`);
    }
  });
}

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
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
      console.log('Datos del formulario:', this.formData);
      
      // Aquí puedes agregar lógica para guardar nuevas opciones en tu base de datos
      await this.saveNewOptionsToDatabase();

      const startingPrice = this.formData.data.startingPrice;
      delete this.formData.data.startingPrice;
      
      if (this.initiaData?.id) {
        const lot: any = await this.homeSercice.updateLot(this.initiaData.id, this.formData.data);
        await this.homeSercice.editLotAution(this.initiaData.auctionDetails[0].id, { 
          auctionId: this.auctionId, 
          coffeeLotId: lot.id, 
          startingPrice: startingPrice 
        });
        this.ref.close(lot);
      } else {
        const lot: any = await this.homeSercice.createLot(this.formData.data);
        console.log(this.formData.data);
        
        await this.homeSercice.addLotAution({ 
          auctionId: this.auctionId, 
          coffeeLotId: lot.id, 
          startingPrice: startingPrice 
        });
        
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

  private async saveNewOptionsToDatabase() {
    // Aquí puedes implementar la lógica para guardar nuevas opciones en tu base de datos
    const newOptions: any = {};

    // Verificar cada campo y guardar nuevas opciones
    const catalogFields = [
      { field: 'variety', catalog: 'varieties' },
      { field: 'process', catalog: 'processes' },
      { field: 'dryingSystem', catalog: 'dryingSystems' },
      { field: 'country', catalog: 'countries' },
      { field: 'region', catalog: 'regions' },
      { field: 'province', catalog: 'provinces' },
      { field: 'municipality', catalog: 'municipalities' },
      { field: 'community', catalog: 'communities' }
    ];

    for (const { field, catalog } of catalogFields) {
      const value = this.formData.data[field];
      if (value && !this.predefinedData[catalog].includes(value.toLowerCase())) {
        // Nueva opción encontrada - aquí puedes guardarla en tu base de datos
        console.log(`Nueva opción para ${field}: ${value}`);
        // await this.homeSercice.saveNewOption(catalog, value);
      }
    }
  }

  close() {
    this.ref.close();
  }
}