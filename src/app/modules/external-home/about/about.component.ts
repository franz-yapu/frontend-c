import { Component } from '@angular/core';
import { TranslateDirective } from '../../../project/directive/translate.directive';

@Component({
  selector: 'app-about',
  imports: [TranslateDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

}
