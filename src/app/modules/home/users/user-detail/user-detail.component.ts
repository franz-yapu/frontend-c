import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../../project/services/api.service';
import { ActivatedRoute } from '@angular/router';
import { SettingComponent } from '../../../../project/components/setting/setting.component';
import { BreadCrumbComponent } from '../../../../project/components/bread-crumb/bread-crumb.component';

@Component({
  selector: 'app-user-detail',
  imports: [BreadCrumbComponent, SettingComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit { 
 public breadcrumbItems = [
    { label: 'Usuarios', icon: 'school', routerLink: '/home/users' },
    { label: 'Estudiantes', icon: 'groups', routerLink: '/students' }
  ];
  public userId: any;
  public userData: any;
  user:any;
  constructor(private apiSevice:ApiService, private route:ActivatedRoute) {}

  async ngOnInit() {
    console.log('UserDetailComponent initialized');
    
    this.userId =  this.route.snapshot.paramMap.get('id');
   this.userData= await this.apiSevice.getUser(this.userId);
   this.user= this.userData.data[0];
   console.log(this.userData);
   
}

realoadData(event: any) {
  console.log('Data reloaded:', event);
  this.ngOnInit(); // Reload user data
}
}