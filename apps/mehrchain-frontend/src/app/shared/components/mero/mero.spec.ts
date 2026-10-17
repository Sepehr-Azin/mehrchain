import { ComponentFixture, TestBed } from '@angular/core/testing';
import { commonTestProviders } from '../../../../testing/test-providers';
import { MeroComponent } from './mero';

describe('MeroComponent', () => {
  let component: MeroComponent;
  let fixture: ComponentFixture<MeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeroComponent],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(MeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map sizes to appropriate classes', () => {
    fixture.componentRef.setInput('size', 'hero');
    fixture.detectChanges();
    expect(component.sizeClasses()).toContain('w-56');

    fixture.componentRef.setInput('size', 'xs');
    fixture.detectChanges();
    expect(component.sizeClasses()).toBe('w-10 h-10');
  });

  it('should support custom glow gradient override', () => {
    const custom = 'radial-gradient(circle, #ff0000 0%, transparent 70%)';
    fixture.componentRef.setInput('customGradient', custom);
    fixture.detectChanges();
    expect(component.effectiveGradient()).toBe(custom);
  });
});
