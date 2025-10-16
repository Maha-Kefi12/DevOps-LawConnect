import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LawFirmComponent } from './law-firm.component';

describe('LawFirmComponent', () => {
  let component: LawFirmComponent;
  let fixture: ComponentFixture<LawFirmComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LawFirmComponent]
    });
    fixture = TestBed.createComponent(LawFirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
