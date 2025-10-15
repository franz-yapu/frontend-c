import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoffeeLotComponent } from './coffee-lot.component';

describe('CoffeeLotComponent', () => {
  let component: CoffeeLotComponent;
  let fixture: ComponentFixture<CoffeeLotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoffeeLotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoffeeLotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
