import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColdStartService } from '../services/cold-start.service';

/** Bound API waits without retrying writes whose outcome may be unknown. */
export const apiRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl.replace(/\/$/, '');
  if (req.url !== api && !req.url.startsWith(`${api}/`)) return next(req);
  const coldStart = inject(ColdStartService);
  return defer(() => {
    coldStart.startRequest();
    return next(req).pipe(
      timeout({
        // Angular emits a Sent event before a response, so bound the response as well.
        each: 90000,
        with: () => {
          throw new HttpErrorResponse({
            status: 408,
            statusText: 'Request timed out',
            error: {
              message:
                req.method === 'GET' || req.method === 'HEAD'
                  ? 'The server is taking longer than expected. Please retry.'
                  : 'Could not confirm the change. Refresh to check before retrying. Your input is kept.',
            },
          });
        },
      }),
      finalize(() => coldStart.finishRequest()),
    );
  });
};
