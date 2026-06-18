import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../project/services/api.service';
import { SettingComponent } from '../../../project/components/setting/setting.component';
import { GeneralService } from '../../../core/gerneral.service';

@Component({
  selector: 'app-buyer-data',
  imports: [ SettingComponent],
  templateUrl: './buyer-data.component.html',
  styleUrl: './buyer-data.component.scss'
})
export class BuyerDataComponent implements OnInit { 

  public userId: any;
  public userData: any;
  user:any;
  constructor(private apiSevice:ApiService, private generalService:GeneralService) {}

  async ngOnInit() {
    const dataUser:any =this.generalService.getUser();
      this.userId = dataUser.id;

   // Perfil propio vía /users/me (el back lo resuelve por el JWT); ya no usa el
   // CRUD genérico /dynamic, que ahora es solo ADMIN.
   this.user = await this.apiSevice.getMe();
   this.userData = this.user;
   
}

realoadData(event: any) {
  console.log('Data reloaded:', event);
  this.ngOnInit(); // Reload user data
}
}