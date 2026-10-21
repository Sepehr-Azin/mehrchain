import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordSetupComponent } from './password-setup';

describe('Verified password setup', () => {
  let auth: any;
  let user: ReturnType<typeof signal<any>>;
  beforeEach(() => {
    user = signal(null);
    auth = {
      currentUser: user,
      getToken: () => user()?.id || null,
      requestPassword: vi.fn().mockResolvedValue({ accepted: true }),
      resetPassword: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [PasswordSetupComponent],
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('waits for a saved response and keeps the draft on failure', async () => {
    const fixture = TestBed.createComponent(PasswordSetupComponent);
    fixture.componentRef.setInput('email', 'owner@example.com');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    await component.request();
    component.code.set('123456');
    component.password.set('secret123');
    component.confirmation.set('secret123');
    auth.resetPassword
      .mockRejectedValueOnce(new Error('Expired code.'))
      .mockResolvedValueOnce({ success: true });
    const saved = vi.fn();
    component.saved.subscribe(saved);
    await component.confirm();
    expect(component.code()).toBe('123456');
    expect(component.password()).toBe('secret123');
    expect(saved).not.toHaveBeenCalled();
    await component.confirm();
    expect(saved).toHaveBeenCalledTimes(1);
    expect(component.done()).toBe(true);
    expect(component.password()).toBe('');
  });

  it('ignores a request response after a session change, before effects flush', async () => {
    let resolve!: (value: any) => void;
    auth.requestPassword.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const fixture = TestBed.createComponent(PasswordSetupComponent);
    fixture.componentRef.setInput('email', 'owner@example.com');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const pending = component.request();
    user.set({ id: 'other' });
    resolve({ accepted: true });
    await pending;
    expect(component.submitted()).toBe(false);
  });
});
