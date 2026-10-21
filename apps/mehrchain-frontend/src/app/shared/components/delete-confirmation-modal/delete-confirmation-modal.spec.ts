import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import { commonTestProviders } from '../../../../testing/test-providers';
import { Commitment } from '@mehrchain/shared-data';

describe('DeleteConfirmationModal', () => {
  let component: DeleteConfirmationModal;
  let fixture: ComponentFixture<DeleteConfirmationModal>;

  const mockCommitment: Commitment = {
    id: 'comm-1',
    title: 'Daily Meditation',
    totalDays: 21,
    currentDay: 5,
    currentStreak: 5,
    isCompletedToday: false,
    startDate: new Date().toISOString(),
    category: 'growth',
    why: 'Find inner calm and mindfulness',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationModal],
      providers: [...commonTestProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('commitment', mockCommitment);
    fixture.detectChanges();
  });

  it('should create and display the original reason why', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Find inner calm and mindfulness');
    expect(compiled.textContent).toContain('Daily Meditation');
  });

  it('should emit cancel when Keep This Habit is clicked', () => {
    const cancelSpy = vi.fn();
    component.cancel.subscribe(cancelSpy);

    const keepBtn = fixture.nativeElement.querySelector('mc-button[variant="primary"] button');
    keepBtn.click();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should emit confirm when Delete Anyway is clicked', () => {
    const confirmSpy = vi.fn();
    component.confirm.subscribe(confirmSpy);

    const deleteBtn = fixture.nativeElement.querySelector('mc-button[variant="danger"] button');
    deleteBtn.click();

    expect(confirmSpy).toHaveBeenCalled();
  });

  it.each([
    '',
    '   ',
    'To prove to myself small steps matter',
    'To prove to myself that small steps matter.',
  ])('does not reflect an empty or supplied sample reason: %s', (why) => {
    fixture.componentRef.setInput('commitment', { ...mockCommitment, why });
    fixture.detectChanges();
    expect(component.reason()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Your private Why');
  });

  it('keeps archive separate from permanent deletion', () => {
    const archive = vi.fn();
    const remove = vi.fn();
    component.archive.subscribe(archive);
    component.confirm.subscribe(remove);
    fixture.nativeElement.querySelector('mc-button[variant="secondary"] button').click();
    expect(archive).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  });

  it('retains the visible reason and disables all choices while saving', () => {
    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();
    const buttons = [
      ...fixture.nativeElement.querySelectorAll('mc-button button'),
    ] as HTMLButtonElement[];
    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(mockCommitment.why);
  });
});
