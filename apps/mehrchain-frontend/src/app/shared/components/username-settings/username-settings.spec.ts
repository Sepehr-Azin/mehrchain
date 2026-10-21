import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsernameSettingsComponent } from './username-settings';

describe('Username settings', () => {
  let user: ReturnType<typeof signal<any>>;
  let auth: any;
  beforeEach(() => {
    vi.useFakeTimers();
    user = signal({ id: 'owner', username: 'owner', usernameSource: 'legacy' });
    auth = {
      currentUser: user,
      getToken: () => user()?.id,
      isLocalToken: () => false,
      usernameAvailability: vi.fn(),
      updateUsername: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [UsernameSettingsComponent],
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('debounces and discards an old availability response after editing', () => {
    const first = new Subject<{ username: string; available: boolean }>();
    const second = new Subject<{ username: string; available: boolean }>();
    auth.usernameAvailability.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const fixture = TestBed.createComponent(UsernameSettingsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.edit('first_name');
    fixture.detectChanges();
    vi.advanceTimersByTime(499);
    expect(auth.usernameAvailability).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(auth.usernameAvailability).toHaveBeenCalledTimes(1);
    component.edit('second_name');
    fixture.detectChanges();
    first.next({ username: 'first_name', available: false });
    expect(component.availability()).toBe('checking');
    vi.advanceTimersByTime(500);
    second.next({ username: 'second_name', available: true });
    expect(component.availability()).toBe('available');
  });

  it('retains the username draft after an atomic save conflict', async () => {
    auth.updateUsername.mockRejectedValue(new Error('That username is in use.'));
    const fixture = TestBed.createComponent(UsernameSettingsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    await component.save();
    expect(component.draft()).toBe('owner');
    expect(component.error()).toContain('in use');
    expect(component.feedback()).toBe('');
  });

  it('does not apply a late saved username to another session', async () => {
    let resolve!: (value: any) => void;
    auth.updateUsername.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const fixture = TestBed.createComponent(UsernameSettingsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const pending = component.save();
    user.set({ id: 'second', username: 'second' });
    fixture.detectChanges();
    resolve({ id: 'owner', username: 'old_saved' });
    await pending;
    expect(component.draft()).toBe('second');
    expect(component.feedback()).toBe('');
  });
});
