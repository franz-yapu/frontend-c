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
      console.log(this.userId);
      
   this.userData= await this.apiSevice.getUser(this.userId);
   this.user= this.userData.data[0];
   console.log(this.userData);
   
}

realoadData(event: any) {
  console.log('Data reloaded:', event);
  this.ngOnInit(); // Reload user data
}
}