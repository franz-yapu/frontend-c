import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { GeneralService } from '../../../core/gerneral.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, NgIf, AsyncPipe],
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss'
})
export class LoadingOverlayComponent {
constructor(public loadingService: GeneralService) {}
}
