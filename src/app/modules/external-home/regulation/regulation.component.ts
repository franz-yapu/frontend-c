import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { BuyerService } from '../../../modules/buyer/buyer.service';

@Component({
  selector: 'app-regulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regulation.component.html',
  styleUrls: ['./regulation.component.scss']
})
export class RegulationComponent implements OnInit, OnDestroy {
  auctionData: any = null;
  auctionTitle: string = 'Subasta de Café Especial';
  loading = true;
  error: string | null = null;
  isBrowser: boolean;
  exchangeRate: number = 6.97; // Tipo de cambio oficial

  private subscriptions: Subscription[] = [];

  regulationSections = [
    {
      id: 'objeto-ambito',
      roman: 'I',
      title: 'Objeto y Ámbito de Aplicación',
      content: `
        <p class="text-amber-700 mb-4">El presente reglamento tiene por objeto establecer las normas, condiciones y procedimientos aplicables a la subasta electrónica de los lotes de café con puntaje en taza superior a 85, seleccionados como ganadores en el Torneo Regional para Familias Cafetaleras.</p>
        <p class="text-amber-700">Este reglamento regula los derechos, obligaciones y sanciones para todos los participantes, y establece las disposiciones que rigen la organización, desarrollo y formalización de las adjudicaciones de lotes, con el fin de asegurar la transparencia, equidad y legalidad del proceso de subasta.</p>
      `
    },
    {
      id: 'participacion',
      roman: 'II',
      title: 'Participación',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Elegibilidad de Participantes y/o compradores</h4>
            <p class="text-amber-700">La subasta está abierta a personas naturales y jurídicas que completen su registro y aprueben una evaluación de confiabilidad realizada por el organizador, la cual verifica antecedentes de cumplimiento y capacidad de pago. Para participar plenamente en la subasta debe registrarse al menos 15 minutos antes del cierre de la subasta. La organización se reserva el derecho de rechazar participantes que no cumplan con los estándares de confiabilidad establecidos.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Responsabilidad de los Participantes</h4>
            <p class="text-amber-700">La participación en la subasta implica la aceptación expresa de las disposiciones contenidas en el presente reglamento, así como el compromiso de cumplir con todas las normas e instrucciones del organizador.</p>
          </div>
        </div>
      `
    },
    {
      id: 'duracion',
      roman: 'III',
      title: 'Duración de la Subasta',
      content: `
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="text-amber-600 font-semibold mr-2">•</span>
            <p class="text-amber-700"><span class="font-semibold">Inicio:</span> La subasta comenzará según la fecha y hora establecida para cada evento.</p>
          </div>
          <div class="flex items-start">
            <span class="text-amber-600 font-semibold mr-2">•</span>
            <p class="text-amber-700"><span class="font-semibold">Cierre:</span> La subasta finalizará según la fecha y hora programada para cada evento.</p>
          </div>
          <p class="text-amber-700 mt-4">El calendario establecido será de carácter inamovible, salvo circunstancias extraordinarias, en cuyo caso se notificará a los participantes con antelación.</p>
        </div>
      `
    },
    {
      id: 'procedimiento-pujas',
      roman: 'IV',
      title: 'Procedimiento de Pujas',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Mecanismo de Pujas</h4>
            <div class="space-y-2 ml-4">
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">Las pujas serán realizadas exclusivamente mediante la plataforma de subasta.</p>
              </div>
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">Cada lote contará con un precio de salida. Las pujas deben efectuarse en incrementos mínimos, que serán especificados para cada lote.</p>
              </div>
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700"><strong>Nota:</strong> Todos los montos están expresados en dólares americanos (USD). Para conversión a bolivianos, 
                utilizar el tipo de cambio oficial de <strong>1 USD = ${ this.exchangeRate } Bs</strong>.</p>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Condiciones de Adjudicación</h4>
            <div class="space-y-2 ml-4">
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">El lote será adjudicado al participante que haya registrado la puja más alta al cierre de la subasta.</p>
              </div>
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">En caso de empate entre dos o más pujas, la adjudicación corresponderá a la primera puja ganadora ingresada.</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'confirmacion-adjudicacion',
      roman: 'V',
      title: 'Confirmación de Adjudicación y Formalización de Compra',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Notificación de Adjudicación</h4>
            <p class="text-amber-700">Los ganadores serán notificados mediante correo electrónico una vez finalizada la subasta, indicando los detalles del lote adjudicado y las instrucciones de pago.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Plazo de Pago y Formalización</h4>
            <p class="text-amber-700">Los ganadores disponen de un plazo de 24 horas, contadas a partir de la notificación, para formalizar la adquisición mediante firma de documento de adjudicación y un adelanto del 30% del valor total.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">3. Sanción por Incumplimiento</h4>
            <p class="text-amber-700 mb-2">En caso de que un adjudicatario no efectúe el pago en el plazo establecido:</p>
            <div class="space-y-1 ml-4">
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">El lote será ofrecido al siguiente postor de mayor puja.</p>
              </div>
              <div class="flex items-start">
                <span class="text-amber-600 mr-2">◦</span>
                <p class="text-amber-700">Se aplicará una sanción de exclusión definitiva del adjudicatario en futuras subastas.</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'condiciones-pago-envio',
      roman: 'VI',
      title: 'Condiciones de Pago y Envío',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Métodos de Pago</h4>
            <p class="text-amber-700">El pago deberá realizarse exclusivamente a través de los medios autorizados por el organizador, notificados previa adjudicación.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Condiciones de Envío</h4>
            <p class="text-amber-700">Los costos de envío serán asumidos por el comprador, quien recibirá el tiempo estimado de entrega una vez confirmado el pago.</p>
          </div>
        </div>
      `
    },
    {
      id: 'politicas-cancelacion',
      roman: 'VII',
      title: 'Políticas de Cancelación y Devolución',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Cancelación de Adjudicación</h4>
            <p class="text-amber-700">Si el pago no se efectúa en el plazo estipulado, el adjudicatario perderá el derecho al lote, el cual será ofrecido al siguiente postor.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Devoluciones</h4>
            <p class="text-amber-700">No se aceptarán devoluciones de los lotes adjudicados, salvo en casos donde el organizador incumpla las condiciones establecidas en el presente reglamento.</p>
          </div>
        </div>
      `
    },
    {
      id: 'disposiciones-generales',
      roman: 'VIII',
      title: 'Disposiciones Generales',
      content: `
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">1. Modificación del Reglamento</h4>
            <p class="text-amber-700">El organizador se reserva el derecho de modificar este reglamento, comprometiéndose a informar cualquier cambio a los participantes inscritos.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">2. Aceptación de los Términos y Condiciones</h4>
            <p class="text-amber-700">La participación en la subasta constituye la aceptación total de las disposiciones contenidas en este reglamento.</p>
          </div>
          <div>
            <h4 class="font-semibold text-amber-900 mb-2">3. Información de Contacto</h4>
            <p class="text-amber-700">Para consultas adicionales, los participantes pueden comunicarse a través del correo electrónico habilitado en la plataforma de subasta.</p>
          </div>
        </div>
      `
    }
  ];

  constructor(
    private buyerService: BuyerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData();
  }

  private async loadAuctionData() {
    try {
      this.loading = true;
      this.error = null;

      const data:any = await this.buyerService.getAutionsLotsActive();
      
      if (data && data.length > 0) {
        this.auctionData = data[0];
        this.auctionTitle = `Subasta "${this.auctionData.title || 'Cafés Especiales'}"`;
      } else {
        this.error = 'No hay subasta activa disponible';
      }
      
    } catch (error) {
      console.error('Error loading auction data:', error);
      this.error = 'Error al cargar los datos de la subasta';
    } finally {
      this.loading = false;
    }
  }

  // Método para formatear fecha en español
  formatSpanishDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Método para formatear hora en español
  formatSpanishTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Método corregido para scroll suave
  scrollToSection(sectionId: string): void {
    if (this.isBrowser) {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}