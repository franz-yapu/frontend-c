import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerLotsComponent } from './seller-lots.component';

describe('SellerLotsComponent', () => {
  let component: SellerLotsComponent;
  let fixture: ComponentFixture<SellerLotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerLotsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerLotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
