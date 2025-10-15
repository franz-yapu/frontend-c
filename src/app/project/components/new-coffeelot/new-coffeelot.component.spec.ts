import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCoffeelotComponent } from './new-coffeelot.component';

describe('NewCoffeelotComponent', () => {
  let component: NewCoffeelotComponent;
  let fixture: ComponentFixture<NewCoffeelotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCoffeelotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCoffeelotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
