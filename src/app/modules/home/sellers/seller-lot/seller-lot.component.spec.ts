import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerLotComponent } from './seller-lot.component';

describe('SellerLotComponent', () => {
  let component: SellerLotComponent;
  let fixture: ComponentFixture<SellerLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerLotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
