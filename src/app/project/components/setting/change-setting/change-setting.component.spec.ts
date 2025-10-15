import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeSettingComponent } from './change-setting.component';

describe('ChangeSettingComponent', () => {
  let component: ChangeSettingComponent;
  let fixture: ComponentFixture<ChangeSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
