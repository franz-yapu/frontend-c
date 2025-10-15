import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {  RouterModule } from '@angular/router';
import { ExternalNavComponent } from "./external-nav/external-nav.component";
interface NavItem {
  name: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-external-home',
  imports: [ RouterModule, CommonModule, ExternalNavComponent],
  templateUrl: './external-home.component.html',
  styleUrl: './external-home.component.scss'
})
export class ExternalHomeComponent {
 
}
