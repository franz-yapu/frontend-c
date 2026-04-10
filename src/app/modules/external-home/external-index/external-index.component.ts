import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateDirective } from '../../../project/directive/translate.directive';

@Component({
  selector: 'app-external-index',
  standalone: true,
  imports: [RouterModule, TranslateDirective],
  templateUrl: './external-index.component.html',
  styleUrl: './external-index.component.scss'
})
export class ExternalIndexComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sponsorsContainer') sponsorsContainer!: ElementRef;
  @ViewChild('sponsorsTrack') sponsorsTrack!: ElementRef;
  
  private router = inject(Router);
  private ngZone = inject(NgZone);
  showModal = false;
  slides = [
    {
      url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      url: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ];

  sponsors = [
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/CARITAS-ALEMANIA.png', url: 'https://www.caritas.org/?lang=es' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/ALEMANA.png', url: 'https://fondo-cooperacion-triangular.net/' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/Samu Foundation.png', url: 'https://fundacionsamu.org/' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/Acnur.jpg', url: 'https://www.acnur.org/' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/WFPnewlogo.png', url: 'https://es.wfp.org/' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/CRS.png', url: 'https://www.crs.org/es' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/OIM.png', url: 'https://www.iom.int/es' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/MEDICOR.png', url: 'https://www.medicor.li/en/' },
    { name: 'Ayuda en Acción', logo: 'assets/img/caritas/logo mariamarina.png', url: 'https://es.mmf.li/' },
  ];

  // Duplicamos los sponsors para crear un efecto infinito suave
  duplicatedSponsors = [...this.sponsors, ...this.sponsors];

  currentSlide = 0;
  private intervalId: any;
  private animationId: number | null = null;
  private isPaused = false;
  private position = 0;
  private speed = 1; // Velocidad de desplazamiento en píxeles por frame

  ngOnInit() {
    this.startAutoSlide();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.startInfiniteScroll();
    }, 100);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    this.stopInfiniteScroll();
  }

  startAutoSlide() {
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.ngZone.run(() => {
          this.nextSlide();
        });
      }, 5000);
    });
  }

  stopAutoSlide() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startInfiniteScroll() {
    if (!this.sponsorsTrack) return;

    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        if (!this.isPaused && this.sponsorsTrack) {
          this.position -= this.speed;
          
          // Cuando hemos desplazado la mitad del track (que contiene los sponsors duplicados),
          // reiniciamos la posición para crear un efecto infinito suave
          const trackWidth = this.sponsorsTrack.nativeElement.scrollWidth / 2;
          
          if (Math.abs(this.position) >= trackWidth) {
            this.position = 0;
          }
          
          this.sponsorsTrack.nativeElement.style.transform = `translateX(${this.position}px)`;
        }
        
        this.animationId = requestAnimationFrame(animate);
      };

      this.animationId = requestAnimationFrame(animate);
    });
  }

  stopInfiniteScroll() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  onSponsorContainerHover(hovering: boolean) {
    this.isPaused = hovering;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  onSliderHover(hovering: boolean) {
    if (hovering) {
      this.stopAutoSlide();
    } else {
      this.startAutoSlide();
    }
  }

  goToAuction(): void {
    this.router.navigate(['/auction']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  closeModal() {
    this.showModal = false;
  }
}