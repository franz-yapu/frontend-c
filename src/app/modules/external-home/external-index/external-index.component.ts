import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateDirective } from '../../../project/directive/translate.directive';

@Component({
  selector: 'app-external-index',
  standalone: true,
  imports: [RouterModule, TranslateDirective],
  templateUrl: './external-index.component.html',
  styleUrl: './external-index.component.scss'
})
export class ExternalIndexComponent implements OnInit, OnDestroy {
    @ViewChild('sponsorsContainer') sponsorsContainer!: ElementRef;
  private router = inject(Router);
  showModal = true;
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
    { name: 'Ayuda en Acción', logo: 'assets/img/tecab/ayuda en accion.svg', url: '#' },
    { name: 'CANEB', logo: 'assets/img/tecab/caneb.svg', url: '#' },
    { name: 'GAMLP', logo: 'assets/img/tecab/gamlp.svg', url: '#' },
    { name: 'HB', logo: 'assets/img/tecab/hb.svg', url: '#' },
    { name: 'JICA', logo: 'assets/img/tecab/jica.svg', url: '#' },
    { name: 'MUNART', logo: 'assets/img/tecab/munart.svg', url: '#' },
    { name: 'Naciones Unidas', logo: 'assets/img/tecab/naciones unidas.svg', url: '#' },
    { name: 'Unión Europea', logo: 'assets/img/tecab/union europea.svg', url: '#' },
    { name: 'Nayra Qata', logo: 'assets/img/tecab/nayra qata.svg', url: '#' },
    { name: 'Presidencia', logo: 'assets/img/tecab/precidencia.svg', url: '#' }
  ];

  currentSlide = 0;
  private intervalId: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
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