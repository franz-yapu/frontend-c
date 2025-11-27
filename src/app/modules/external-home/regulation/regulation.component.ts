import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  private sanitizer = inject(DomSanitizer);
  
  auctionData: any = null;
  auctionTitle: string = 'Subasta de Café Especial';
  loading = true;
  error: string | null = null;
  isBrowser: boolean;
  
  // Variables para el PDF
  pdfUrl: SafeResourceUrl | null = null;
  pdfError: boolean = false;
  currentPdfPath: string = '';

  private subscriptions: Subscription[] = [];
  private languageEffect = effect(() => {
    // Cuando cambia el idioma, recargar el PDF correspondiente
    const currentLang = this.translationService.currentLanguage();
    this.loadPdfForLanguage(currentLang);
  });

  constructor(
    private buyerService: BuyerService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    await this.loadAuctionData();
    // Cargar el PDF inicial basado en el idioma actual
    const currentLang = this.translationService.currentLanguage();
    this.loadPdfForLanguage(currentLang);
  }

  private loadPdfForLanguage(language: string): void {
    let pdfPath: string;
    
    switch (language) {
      case 'en':
        pdfPath = 'assets/pdf/invitacion eng.pdf';
        break;
      case 'es':
      default:
        pdfPath = 'assets/pdf/invitacion.pdf';
        break;
    }
    
    this.currentPdfPath = pdfPath;
    this.loadPdf();
  }

  loadPdf(): void {
    this.pdfError = false;
    
    // Crear una URL segura para el PDF usando el sanitizer
    const fullPath = `${this.currentPdfPath}?t=${new Date().getTime()}`; // Cache buster
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullPath);
  }

  onPdfLoad(): void {
    console.log('PDF cargado correctamente');
    this.pdfError = false;
  }

  onPdfError(): void {
    console.error('Error al cargar el PDF');
    this.pdfError = true;
  }

  private async loadAuctionData() {
    try {
      this.loading = true;
      this.error = null;

      const data: any = await this.buyerService.getAutionsLotsActive();
      
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

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.languageEffect.destroy();
  }
}