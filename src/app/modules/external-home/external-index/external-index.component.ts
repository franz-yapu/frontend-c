import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-external-index',
  imports: [RouterModule],
  templateUrl: './external-index.component.html',
  styleUrl: './external-index.component.scss'
})
export class ExternalIndexComponent {

constructor(public router: Router ) { }

  goToAuction(): void {
   this.router.navigate(['/Coffee/auction']);
  }
  goToRegister(): void {
   this.router.navigate(['/register']);
  }
  goToLogin(): void {
   this.router.navigate(['/login']);
  }

}
