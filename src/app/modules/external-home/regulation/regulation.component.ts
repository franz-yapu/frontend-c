import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { BuyerService } from '../../../modules/buyer/buyer.service';
import { TranslateDirective } from '../../../project/directive/translate.directive';
import { TranslationService } from '../../../project/services/translate.service';

@Component({
  selector: 'app-regulation',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './regulation.component.html',
  styleUrls: ['./regulation.component.scss']
})
export class RegulationComponent implements OnInit, OnDestroy {
  private translationService = inject(TranslationService);
  
  auctionData: any = null;
  auctionTitle: string = 'Subasta de Café Especial';
  loading = true;
  error: string | null = null;
  isBrowser: boolean;
  exchangeRate: number = 6.97;

  private subscriptions: Subscription[] = [];
  private languageEffect = effect(() => {
    // Este effect se ejecutará cada vez que currentLanguage cambie
    this.translationService.currentLanguage();
    this.loadSectionContent();
  });

  // Solo mantener los IDs y títulos, el contenido se cargará dinámicamente
  regulationSections = [
    { id: 'objeto-ambito', roman: 'I', titleKey: 'REGULATION.SECTIONS.OBJECT.TITLE' },
    { id: 'participacion', roman: 'II', titleKey: 'REGULATION.SECTIONS.PARTICIPATION.TITLE' },
    { id: 'duracion', roman: 'III', titleKey: 'REGULATION.SECTIONS.DURATION.TITLE' },
    { id: 'procedimiento-pujas', roman: 'IV', titleKey: 'REGULATION.SECTIONS.BIDDING.TITLE' },
    { id: 'confirmacion-adjudicacion', roman: 'V', titleKey: 'REGULATION.SECTIONS.CONFIRMATION.TITLE' },
    { id: 'condiciones-pago-envio', roman: 'VI', titleKey: 'REGULATION.SECTIONS.PAYMENT_SHIPPING.TITLE' },
    { id: 'politicas-cancelacion', roman: 'VII', titleKey: 'REGULATION.SECTIONS.CANCELLATION.TITLE' },
    { id: 'disposiciones-generales', roman: 'VIII', titleKey: 'REGULATION.SECTIONS.GENERAL.TITLE' }
  ];

  // Contenido traducido que se actualizará
  sectionContent: { [key: string]: string } = {};

  constructor(
    private buyerService: BuyerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData();
    this.loadSectionContent();
  }

  private loadSectionContent(): void {
    // Cargar el contenido traducido para cada sección
    this.sectionContent = {
      'objeto-ambito': this.getObjectContent(),
      'participacion': this.getParticipationContent(),
      'duracion': this.getDurationContent(),
      'procedimiento-pujas': this.getBiddingContent(),
      'confirmacion-adjudicacion': this.getConfirmationContent(),
      'condiciones-pago-envio': this.getPaymentShippingContent(),
      'politicas-cancelacion': this.getCancellationContent(),
      'disposiciones-generales': this.getGeneralContent()
    };
  }

  private getObjectContent(): string {
    return `
      <p class="text-black/70 mb-4">${this.translationService.translate('REGULATION.SECTIONS.OBJECT.PARAGRAPH1')}</p>
      <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.OBJECT.PARAGRAPH2')}</p>
    `;
  }

  private getParticipationContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.PARTICIPATION.ELIGIBILITY_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.PARTICIPATION.ELIGIBILITY_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.PARTICIPATION.RESPONSIBILITY_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.PARTICIPATION.RESPONSIBILITY_DESC')}</p>
        </div>
      </div>
    `;
  }

  private getDurationContent(): string {
    return `
      <div class="space-y-3">
        <div class="flex items-start">
          <span class="text-amber-600 font-semibold mr-2">•</span>
          <p class="text-black/70">
            <span class="font-semibold">${this.translationService.translate('REGULATION.SECTIONS.DURATION.START_LABEL')}</span>
            ${this.translationService.translate('REGULATION.SECTIONS.DURATION.START_DESC')}
          </p>
        </div>
        <div class="flex items-start">
          <span class="text-amber-600 font-semibold mr-2">•</span>
          <p class="text-black/70">
            <span class="font-semibold">${this.translationService.translate('REGULATION.SECTIONS.DURATION.END_LABEL')}</span>
            ${this.translationService.translate('REGULATION.SECTIONS.DURATION.END_DESC')}
          </p>
        </div>
        <p class="text-black/70 mt-4">${this.translationService.translate('REGULATION.SECTIONS.DURATION.FOOTNOTE')}</p>
      </div>
    `;
  }

  private getBiddingContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.MECHANISM_TITLE')}</h4>
          <div class="space-y-2 ml-4">
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.MECHANISM_POINT1')}</p>
            </div>
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.MECHANISM_POINT2')}</p>
            </div>
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">
                <strong>${this.translationService.translate('REGULATION.SECTIONS.BIDDING.NOTE_LABEL')}</strong>
                ${this.translationService.translate('REGULATION.SECTIONS.BIDDING.NOTE_DESC')}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.AWARD_CONDITIONS_TITLE')}</h4>
          <div class="space-y-2 ml-4">
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.AWARD_CONDITION1')}</p>
            </div>
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.BIDDING.AWARD_CONDITION2')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getConfirmationContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NOTIFICATION_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NOTIFICATION_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.PAYMENT_DEADLINE_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.PAYMENT_DEADLINE_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NON_COMPLIANCE_TITLE')}</h4>
          <p class="text-black/70 mb-2">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NON_COMPLIANCE_DESC')}</p>
          <div class="space-y-1 ml-4">
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NON_COMPLIANCE_POINT1')}</p>
            </div>
            <div class="flex items-start">
              <span class="text-amber-600 mr-2">◦</span>
              <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CONFIRMATION.NON_COMPLIANCE_POINT2')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getPaymentShippingContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.PAYMENT_SHIPPING.PAYMENT_METHODS_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.PAYMENT_SHIPPING.PAYMENT_METHODS_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.PAYMENT_SHIPPING.SHIPPING_CONDITIONS_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.PAYMENT_SHIPPING.SHIPPING_CONDITIONS_DESC')}</p>
        </div>
      </div>
    `;
  }

  private getCancellationContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.CANCELLATION.CANCELLATION_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CANCELLATION.CANCELLATION_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.CANCELLATION.REFUNDS_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.CANCELLATION.REFUNDS_DESC')}</p>
        </div>
      </div>
    `;
  }

  private getGeneralContent(): string {
    return `
      <div class="space-y-4">
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.MODIFICATION_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.MODIFICATION_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.ACCEPTANCE_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.ACCEPTANCE_DESC')}</p>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.CONTACT_INFO_TITLE')}</h4>
          <p class="text-black/70">${this.translationService.translate('REGULATION.SECTIONS.GENERAL.CONTACT_INFO_DESC')}</p>
        </div>
      </div>
    `;
  }

  // Método helper para obtener contenido de sección
  getSectionContent(sectionId: string): string {
    return this.sectionContent[sectionId] || '';
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

  formatSpanishTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

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
    this.languageEffect.destroy();
  }
}