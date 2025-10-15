import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleCssComponent } from './example-css.component';

describe('ExampleCssComponent', () => {
  let component: ExampleCssComponent;
  let fixture: ComponentFixture<ExampleCssComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleCssComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExampleCssComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
