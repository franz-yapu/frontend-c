import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoffeeLotDetailComponent } from './coffee-lot-detail.component';

describe('CoffeeLotDetailComponent', () => {
  let component: CoffeeLotDetailComponent;
  let fixture: ComponentFixture<CoffeeLotDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoffeeLotDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoffeeLotDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
