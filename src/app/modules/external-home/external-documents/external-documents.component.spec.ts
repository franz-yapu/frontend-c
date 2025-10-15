import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalDocumentsComponent } from './external-documents.component';

describe('ExternalDocumentsComponent', () => {
  let component: ExternalDocumentsComponent;
  let fixture: ComponentFixture<ExternalDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalDocumentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
