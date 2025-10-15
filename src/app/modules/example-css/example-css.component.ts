import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-example-css',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './example-css.component.html',
  styleUrl: './example-css.component.scss'
})
export class ExampleCssComponent {

}
