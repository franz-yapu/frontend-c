import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToastComponent } from './project/components/toast/toast.component';
import { LoadingOverlayComponent } from './project/components/loading-overlay/loading-overlay.component';
import { BrandingService } from './core/branding/branding.service';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,ToastComponent, LoadingOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private brandingService = inject(BrandingService);
  private titleService = inject(Title);

  title = 'Subastas de Café';
  // Versión de la app web para el badge global (ver app.component.html).
  appVersion = environment.appVersion;

  constructor() {
    // React to branding config changes and update document title
    effect(() => {
      const config = this.brandingService.configSignal();
      const institutionName = config.institutionName || 'Subastas de Café';
      this.titleService.setTitle(`${institutionName} - Subastas`);
    });
  }

  ngOnInit(): void {}
}
