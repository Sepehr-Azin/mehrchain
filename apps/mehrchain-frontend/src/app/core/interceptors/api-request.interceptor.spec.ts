import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ColdStartService } from '../services/cold-start.service';
import { apiRequestInterceptor } from './api-request.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('API request deadline', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let tracking: { startRequest: ReturnType<typeof vi.fn>; finishRequest: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.useFakeTimers();
    tracking = { startRequest: vi.fn(), finishRequest: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor, apiRequestInterceptor])),
        provideHttpClientTesting(),
        { provide: ColdStartService, useValue: tracking },
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    requests.verify();
    vi.useRealTimers();
  });

  it('ends a stalled write after Sent without replaying or confirming it', () => {
    const error = vi.fn();
    const next = vi.fn();
    const url = `${environment.apiUrl}/commitments`;
    http.post(url, { title: 'Kept draft' }).subscribe({ error, next });
    const request = requests.expectOne(url);
    vi.advanceTimersByTime(90000);
    expect(request.cancelled).toBe(true);
    expect(next).not.toHaveBeenCalled();
    expect(error.mock.calls[0][0].message).toContain('Refresh to check before retrying');
    expect(tracking.finishRequest).toHaveBeenCalledTimes(1);
    requests.expectNone(url);
  });

  it('finishes tracking on explicit cancellation', () => {
    const subscription = http.get(`${environment.apiUrl}/auth/me`).subscribe();
    requests.expectOne(`${environment.apiUrl}/auth/me`);
    subscription.unsubscribe();
    expect(tracking.startRequest).toHaveBeenCalledTimes(1);
    expect(tracking.finishRequest).toHaveBeenCalledTimes(1);
  });

  it('retries a gateway timeout once for a read, then stops', () => {
    const error = vi.fn();
    const url = `${environment.apiUrl}/auth/me`;
    http.get(url).subscribe({ error });
    requests.expectOne(url).flush(null, { status: 524, statusText: 'Origin timed out' });
    vi.advanceTimersByTime(1000);
    requests.expectOne(url).flush(null, { status: 504, statusText: 'Gateway timeout' });
    vi.advanceTimersByTime(1000);
    requests.expectNone(url);
    expect(error).toHaveBeenCalledTimes(1);
    expect(tracking.startRequest).toHaveBeenCalledTimes(1);
    expect(tracking.finishRequest).toHaveBeenCalledTimes(1);
  });

  it('does not replay a write after a 524 response', () => {
    const error = vi.fn();
    const url = `${environment.apiUrl}/commitments`;
    http.post(url, { title: 'Kept draft' }).subscribe({ error });
    requests.expectOne(url).flush(null, { status: 524, statusText: 'Origin timed out' });
    vi.advanceTimersByTime(1000);
    requests.expectNone(url);
    expect(error.mock.calls[0][0].message).toContain('Refresh to check before retrying');
  });

  it('cancels a scheduled read retry on unsubscribe', () => {
    const url = `${environment.apiUrl}/auth/me`;
    const subscription = http.get(url).subscribe();
    requests.expectOne(url).flush(null, { status: 504, statusText: 'Gateway timeout' });
    subscription.unsubscribe();
    vi.advanceTimersByTime(1000);
    requests.expectNone(url);
    expect(tracking.finishRequest).toHaveBeenCalledTimes(1);
  });

  it('leaves unrelated requests outside the API deadline and tracking', () => {
    http.get('https://example.com/asset').subscribe();
    const request = requests.expectOne('https://example.com/asset');
    vi.advanceTimersByTime(90000);
    expect(request.cancelled).toBe(false);
    expect(tracking.startRequest).not.toHaveBeenCalled();
    request.flush({});
  });
});
