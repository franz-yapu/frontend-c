import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutionLotComponent } from './aution-lot.component';

describe('AutionLotComponent', () => {
  let component: AutionLotComponent;
  let fixture: ComponentFixture<AutionLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutionLotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutionLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
