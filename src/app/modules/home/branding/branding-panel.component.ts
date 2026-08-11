import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandingService, BrandingConfig } from '../../../core/branding/branding.service';
import { GeneralService } from '../../../core/gerneral.service';
import { finalize, Subscription } from 'rxjs';

interface LogoUpload {
  type: 'main' | 'favicon' | 'email';
  label: string;
  preview: string | null;
  file: File | null;
}

@Component({
  selector: 'app-branding-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './branding-panel.component.html',
  styleUrl: './branding-panel.component.scss'
})
export class BrandingPanelComponent implements OnInit, OnDestroy {
  private brandingService = inject(BrandingService);
  private session = inject(GeneralService);
  private subs = new Subscription();

  // Estado de sesión: el guardado requiere un ADMIN autenticado. Lo exponemos
  // para mostrar un aviso claro y evitar el opaco "Unauthorized" del backend.
  sessionRole = signal<string | null>(null);
  hasToken = signal<boolean>(false);
  isAdmin = computed(() => this.hasToken() && this.sessionRole() === 'ADMIN');

  draft: BrandingConfig = {
    primaryColor: '#CA3636',
    secondaryColor: '#FF9A24',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    dangerColor: '#EF4444',
    infoColor: '#3B82F6',
    surfaceColor: '#FFFFFF',
    textColor: '#1F2937',
    themeMode: 'light',
    fontFamily: 'Inter',
    borderRadius: '4px',
    institutionName: 'Cáritas Bolivia',
    institutionShortName: 'Cáritas',
  };

  saving = signal(false);
  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  history = signal<any[]>([]);

  themeModes = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🖥️' },
  ];

  fonts = ['Inter', 'Roboto', 'Outfit', 'Poppins', 'Open Sans', 'Lato', 'Montserrat'];

  logos: LogoUpload[] = [
    { type: 'main', label: 'Logo Principal', preview: null, file: null },
    { type: 'favicon', label: 'Favicon', preview: null, file: null },
    { type: 'email', label: 'Logo para Emails', preview: null, file: null },
  ];

  // Minimalist solid header instead of gradient
  headerColor = computed(() => this.draft.primaryColor);
  currentYear = new Date().getFullYear();


  ngOnInit(): void {
    // Estado de sesión (para el aviso de "no eres admin / sin sesión").
    this.hasToken.set(!!this.session.getToken());
    this.sessionRole.set(this.session.getUser()?.role?.name ?? null);

    // Sincronización inicial
    this.draft = { ...this.brandingService.currentConfig };

    // Suscribirse para actualizaciones futuras (ej. cuando termine el fetch del servidor)
    this.subs.add(
      this.brandingService.config$.subscribe(config => {
        if (config) {
          this.draft = { ...config };
          if (config.logoUrl) this.logos[0].preview = config.logoUrl;
          if (config.faviconUrl) this.logos[1].preview = config.faviconUrl;
          if (config.emailLogoUrl) this.logos[2].preview = config.emailLogoUrl;
        }
      })
    );

    this.subs.add(
      this.brandingService.getHistory().subscribe({
        next: (h: any[]) => this.history.set(h),
        error: () => this.history.set([]),
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Valida formato hex (#RGB o #RRGGBB) para feedback visual en el input. */
  isValidHex(value: string | undefined): boolean {
    return !!value && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  }

  onColorChange(): void {
    // Live preview sin guardar (applyBranding ya ignora hex inválidos vía safeColor).
    this.brandingService.applyBranding(this.draft);
  }

  onFontChange(): void {
    this.brandingService.applyBranding(this.draft);
  }

  onRadiusChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.draft.borderRadius = `${val}px`;
    this.brandingService.applyBranding(this.draft);
  }

  radiusPx(): number {
    return parseInt(this.draft.borderRadius ?? '4', 10);
  }

  onLogoSelect(event: Event, logo: LogoUpload): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.setLogoFile(logo, file);
  }

  onLogoDrop(event: DragEvent, logo: LogoUpload): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.setLogoFile(logo, file);
  }

  private setLogoFile(logo: LogoUpload, file: File): void {
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('error', 'El archivo debe ser menor a 2MB');
      return;
    }
    logo.file = file;
    const reader = new FileReader();
    reader.onload = (e) => { logo.preview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeLogo(logo: LogoUpload): void {
    logo.file = null;
    logo.preview = null;
  }

  saveChanges(): void {
    if (!this.draft.id) {
      // Crear nueva configuración
      this.saving.set(true);
      this.brandingService.createConfig(this.draft)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: (created: BrandingConfig) => {
            this.draft = { ...created };
            this.uploadPendingLogos(created.id!);
            this.showToast('success', '✅ Configuración creada exitosamente');
          },
          error: (err) => this.showToast('error', this.authError(err, 'crear la configuración')),
        });
    } else {
      this.saving.set(true);
      this.brandingService.updateConfig(this.draft.id, this.draft)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: (updated: BrandingConfig) => {
            this.draft = { ...updated };
            this.uploadPendingLogos(updated.id!);
            this.brandingService.applyBranding(updated);
            this.showToast('success', '✅ Cambios guardados exitosamente');
          },
          error: (err) => this.showToast('error', this.authError(err, 'guardar los cambios')),
        });
    }
  }

  /** Traduce errores HTTP a mensajes accionables (clave del problema actual). */
  private authError(err: any, action: string): string {
    const status = err?.status;
    if (status === 401) {
      return '🔒 Sesión inválida o expirada (401). Cierra sesión y entra de nuevo como admin.';
    }
    if (status === 403) {
      return '⛔ Tu usuario no es ADMIN (403). Inicia sesión con una cuenta de administrador.';
    }
    if (status === 0) {
      return '🌐 No se pudo contactar al servidor. ¿Está el backend arriba en localhost:8090?';
    }
    return `❌ Error al ${action}` + (status ? ` (HTTP ${status})` : '');
  }

  private uploadPendingLogos(id: string): void {
    this.logos.forEach(logo => {
      if (logo.file) {
        this.brandingService.uploadLogo(id, logo.file, logo.type).subscribe({
          next: () => { logo.file = null; },
          error: () => this.showToast('error', `❌ Error al subir el logo ${logo.label}`),
        });
      }
    });
  }

  resetConfirm(): void {
    if (!confirm('¿Restablecer a los valores por defecto? Esta acción no se puede deshacer.')) return;
    this.saving.set(true);
    this.brandingService.resetToDefault()
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (config: BrandingConfig) => {
          this.draft = { ...config };
          this.logos.forEach(l => { l.preview = null; l.file = null; });
          this.showToast('success', '🔄 Valores restablecidos a los defaults');
        },
        error: () => this.showToast('error', '❌ Error al restablecer'),
      });
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 4000);
  }

  private darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
