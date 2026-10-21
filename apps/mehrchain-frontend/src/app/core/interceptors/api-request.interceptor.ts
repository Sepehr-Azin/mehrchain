import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColdStartService } from '../services/cold-start.service';

/** Bound API waits without retrying writes whose outcome may be unknown. */
export const apiRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl.replace(/\/$/, '');
  if (req.url !== api && !req.url.startsWith(`${api}/`)) return next(req);
  const coldStart = inject(ColdStartService);
  return defer(() => {
    coldStart.startRequest();
    const deadline = Date.now() + 90000;
    const readOnly = req.method === 'GET' || req.method === 'HEAD';
    return defer(() =>
      next(req).pipe(
        timeout({
          // Angular emits a Sent event before a response, so bound the response as well.
          each: Math.max(1, deadline - Date.now()),
          with: () => {
            throw new HttpErrorResponse({
              status: 408,
              statusText: 'Request timed out',
              error: {
                message: readOnly
                  ? 'The server is taking longer than expected. Please retry.'
                  : 'Could not confirm the change. Refresh to check before retrying. Your input is kept.',
              },
            });
          },
        }),
      ),
    ).pipe(
      retry({
        count: 1,
        delay: (error: HttpErrorResponse) =>
          readOnly && [502, 503, 504, 524].includes(error.status) && Date.now() + 1000 < deadline
            ? timer(1000)
            : throwError(() => error),
      }),
      finalize(() => coldStart.finishRequest()),
    );
  });
};
