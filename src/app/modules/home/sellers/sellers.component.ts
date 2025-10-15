import { Component, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { TableColumn, TableComponent } from '../../../project/components/table/table.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sellers',
  imports: [TableComponent],
  templateUrl: './sellers.component.html',
  styleUrl: './sellers.component.scss'
})
export class SellersComponent implements OnInit {

    users: any[] = []; // Reemplaza 'any' con tu interfaz User
    totalUsers = 0;
    currentPage = 1;
    sellers: any[] = [];
    columns: TableColumn[] = [
      { key: 'firstName', label: 'Nombre', sortable: true },
      { key: 'lastName', label: 'Apellidos', sortable: true },
      { key: 'email', label: 'Correo electronico', sortable: true },
      { key: 'companyName', label: 'Empresa o Asociación', sortable: true },
     
    ];

  constructor(private service:HomeService, private router: Router) {}
 

  async ngOnInit() {
    const sellers:any = await this.service.getSellers();
    this.sellers = sellers.data;
    console.log(sellers);
  }


  onPageChange(page: number) {
    this.currentPage = page;
    // Carga los datos para la nueva págin
  }

  onRowClick(seller: any) {
    this.router.navigate(['/home/sellers/', seller.id]);
  }

 onTableAction(event: { action: string, item?: any }) {
   
  }

  onReloadData() {
    this.ngOnInit();
  }

  


}
