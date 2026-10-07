import { AsyncPipe, CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GeneralService } from '../../../core/gerneral.service';
import { CoffeeLoaderComponent } from '../coffee-loader/coffee-loader.component';

/**
 * Loader global de la app. Se pinta una sola vez en `app.component.html` y se
 * enciende solo: `LoadingInterceptor` avisa a `GeneralService` cuando hay
 * peticiones en vuelo y este únicamente lo muestra si la espera se alarga
 * (conexión lenta), para que en una red normal ni se note.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, AsyncPipe, CoffeeLoaderComponent],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  constructor(public loadingService: GeneralService) {}
}
