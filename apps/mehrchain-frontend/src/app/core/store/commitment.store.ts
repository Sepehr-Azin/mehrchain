import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, effect, inject } from '@angular/core';
import { Commitment, CommitmentCalendar, CommitmentSync } from '@mehrchain/shared-data';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColdStartService } from '../services/cold-start.service';

export interface CommitmentState {
  commitments: Commitment[];
  archivedCommitments: Commitment[];
  isLoading: boolean;
  syncError: string | null;
  activeUserId: string | null;
  calendar: CommitmentCalendar | null;
  isStale: boolean;
}
const initialState: CommitmentState = {
  commitments: [],
  archivedCommitments: [],
  isLoading: false,
  syncError: null,
  activeUserId: null,
  calendar: null,
  isStale: true,
};
export function getUserStorageKey(userId: string): string {
  return `mehrchain_commitments_${userId}`;
}
export function getUserArchivedStorageKey(userId: string): string {
  return `mehrchain_archived_commitments_${userId}`;
}
export function isRemoteToken(token: string | null): boolean {
  return !!token && !token.startsWith('local_') && !token.startsWith('mock_');
}
function readCache(key: string): Commitment[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
export const CommitmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasAnyCommitment: computed(() => store.commitments().length > 0),
    overallStreak: computed(() =>
      Math.max(0, ...store.commitments().map((c) => c.currentStreak || 0)),
    ),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const coldStart = inject(ColdStartService);
    const API = `${environment.apiUrl}/commitments`;
    const remote = () => {
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      if (environment.production && !isRemoteToken(token))
        throw new Error('Please sign in to save your habit.');
      return isRemoteToken(token);
    };
    // Apply writes only after server confirmation, and reject replies from an earlier session.
    async function confirmed<T>(request: () => Promise<T>): Promise<T> {
      const session = sessionVersion;
      const user = store.activeUserId();
      const token = localStorage.getItem('mehrchain_auth_token_v1');
      coldStart.startRequest();
      try {
        const result = await request();
        if (
          session !== sessionVersion ||
          store.activeUserId() !== user ||
          localStorage.getItem('mehrchain_auth_token_v1') !== token
        )
          throw new Error('Your session changed. Please reload.');
        return result;
      } finally {
        coldStart.finishRequest();
      }
    }
    function record(value: Commitment): Commitment {
      if (!value?.id)
        throw new Error(
          'The server did not confirm the saved habit. Please reload before retrying.',
        );
      return value;
    }
    let mutationVersion = 0;
    let sessionVersion = 0;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let syncRequest: Promise<void> | undefined;
    function cancelRefresh() {
      clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
    function scheduleRefresh(calendar: CommitmentCalendar, elapsed = 0) {
      cancelRefresh();
      // Relative server time and a monotonic duration; never trust the device wall clock.
      const delay = Math.max(
        1000,
        Date.parse(calendar.nextDayAt) - Date.parse(calendar.serverNow) - elapsed,
      );
      refreshTimer = setTimeout(() => {
        void methods.refreshCalendar();
      }, delay);
    }
    function applyCalendar(calendar?: CommitmentCalendar) {
      if (!calendar) return;
      const current = store.calendar();
      if (current && current.serverNow > calendar.serverNow) return;
      // A single write confirms only one habit. Refresh all cards when its day changed.
      // Keep the existing deadline on same-day writes so slow responses cannot postpone midnight.
      if (!current || current.currentDayKey !== calendar.currentDayKey) {
        patchState(store, { isStale: true });
        cancelRefresh();
        refreshTimer = setTimeout(() => {
          void methods.refreshCalendar();
        }, 1000);
      }
    }
    const completionRequests = new Map<string, Promise<void>>();
    const methods = {
      loadForUser(userId: string): void {
        sessionVersion++;
        mutationVersion++;
        syncRequest = undefined;
        completionRequests.clear();
        cancelRefresh();
        patchState(store, {
          calendar: null,
          isStale: isRemoteToken(localStorage.getItem('mehrchain_auth_token_v1')),
          isLoading: false,
          activeUserId: userId,
          syncError: null,
          commitments: readCache(getUserStorageKey(userId)),
          archivedCommitments: readCache(getUserArchivedStorageKey(userId)),
        });
      },
      syncWithBackend(): Promise<void> {
        if (!store.activeUserId() || !remote()) return Promise.resolve();
        if (syncRequest) return syncRequest;
        patchState(store, { isLoading: true, syncError: null });
        const user = store.activeUserId();
        const session = sessionVersion;
        const version = mutationVersion;
        const started = performance.now();
        const request = (async () => {
          try {
            const data = await confirmed(() =>
              firstValueFrom(
                http
                  .get<CommitmentSync>(`${API}/sync`, {
                    params: { 'ngsw-bypass': 'true' },
                  })
                  .pipe(timeout(60000)),
              ),
            );
            if (
              !Array.isArray(data?.commitments) ||
              !data.calendar?.currentDayKey ||
              !Number.isFinite(Date.parse(data.calendar.serverNow)) ||
              !(Date.parse(data.calendar.nextDayAt) > Date.parse(data.calendar.serverNow))
            )
              throw new Error('Unable to load habits.');
            if (version === mutationVersion) {
              const elapsed = performance.now() - started;
              const expired =
                elapsed >=
                Date.parse(data.calendar.nextDayAt) - Date.parse(data.calendar.serverNow);
              patchState(store, {
                commitments: data.commitments,
                calendar: data.calendar,
                isStale: expired,
              });
              scheduleRefresh(data.calendar, elapsed);
            } else {
              // A confirmed write won the race. Fetch again instead of keeping an obsolete day snapshot.
              cancelRefresh();
              refreshTimer = setTimeout(() => {
                void methods.refreshCalendar();
              }, 1000);
            }
          } catch {
            if (store.activeUserId() === user && session === sessionVersion) {
              patchState(store, {
                isStale: true,
                syncError: 'Could not refresh habits. Saved information may be out of date.',
              });
              cancelRefresh();
              refreshTimer = setTimeout(() => {
                void methods.refreshCalendar();
              }, 60000);
            }
          } finally {
            if (store.activeUserId() === user && session === sessionVersion)
              patchState(store, { isLoading: false });
          }
        })().finally(() => {
          if (syncRequest === request) syncRequest = undefined;
        });
        syncRequest = request;
        return request;
      },
      async refreshCalendar(): Promise<void> {
        if (
          !store.activeUserId() ||
          !isRemoteToken(localStorage.getItem('mehrchain_auth_token_v1'))
        )
          return;
        patchState(store, { isStale: true });
        await methods.syncWithBackend();
      },
      stopDayRefresh(): void {
        sessionVersion++;
        cancelRefresh();
      },
      async addCommitment(data: Partial<Commitment>): Promise<Commitment> {
        const payload = {
          title: data.title,
          category: data.category,
          why: data.why,
          totalDays: data.totalDays ?? 21,
          reminderTime: data.reminderTime,
          isPublic: data.isPublic ?? false,
        };
        const saved = remote()
          ? record(await confirmed(() => firstValueFrom(http.post<Commitment>(API, payload))))
          : ({
              ...payload,
              id: crypto.randomUUID(),
              currentDay: 0,
              currentStreak: 0,
              isCompletedToday: false,
              startDate: new Date().toISOString(),
              history: [],
            } as Commitment);
        mutationVersion++;
        applyCalendar(saved.calendar);
        patchState(store, { commitments: [saved, ...store.commitments()] });
        return saved;
      },
      completeCommitment(id: string, note?: string): Promise<void> {
        const existing = completionRequests.get(id);
        if (existing) return existing;
        const request = (async () => {
          const target = store.commitments().find((c) => c.id === id);
          if (!target) throw new Error('Habit not found. Please reload.');
          const isRemote = remote();
          if (
            !isRemote &&
            !target.isCompletedToday &&
            target.totalDays !== -1 &&
            target.currentDay >= target.totalDays
          )
            throw new Error('Goal reached. Continue as Endless or archive this habit.');
          const updated = isRemote
            ? record(
                await confirmed(() =>
                  firstValueFrom(http.patch<Commitment>(`${API}/${id}/complete`, { note })),
                ),
              )
            : target.isCompletedToday
              ? target
              : {
                  ...target,
                  currentStreak: target.currentStreak + 1,
                  currentDay:
                    target.totalDays === -1
                      ? target.currentDay + 1
                      : Math.min(target.currentDay + 1, target.totalDays),
                  isCompletedToday: true,
                  history: [...(target.history || []), new Date().toISOString()],
                };
          mutationVersion++;
          applyCalendar(updated.calendar);
          patchState(store, {
            commitments: store.commitments().map((c) => (c.id === id ? updated : c)),
          });
        })().finally(() => {
          if (completionRequests.get(id) === request) completionRequests.delete(id);
        });
        completionRequests.set(id, request);
        return request;
      },
      async updateCommitment(id: string, updates: Partial<Commitment>): Promise<Commitment> {
        const target = store.commitments().find((c) => c.id === id);
        if (!target) throw new Error('Habit not found.');
        const { title, category, why, totalDays, reminderTime, isPublic } = updates;
        if (totalDays !== undefined && totalDays !== -1 && totalDays < target.currentDay)
          throw new Error('The goal cannot be lower than your completed days.');
        const updated = remote()
          ? record(
              await confirmed(() =>
                firstValueFrom(
                  http.patch<Commitment>(`${API}/${id}`, {
                    title,
                    category,
                    why,
                    totalDays,
                    reminderTime,
                    isPublic,
                  }),
                ),
              ),
            )
          : { ...target, ...updates };
        mutationVersion++;
        applyCalendar(updated.calendar);
        patchState(store, {
          commitments: store.commitments().map((c) => (c.id === id ? updated : c)),
        });
        return updated;
      },
      async removeCommitment(id: string): Promise<void> {
        const target = store.commitments().find((c) => c.id === id);
        if (remote()) await confirmed(() => firstValueFrom(http.delete(`${API}/${id}`)));
        mutationVersion++;
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: target
            ? [
                { ...target, isArchived: true },
                ...store.archivedCommitments().filter((c) => c.id !== id),
              ]
            : store.archivedCommitments(),
        });
      },
      async fetchArchivedCommitments(): Promise<Commitment[]> {
        if (!remote()) return store.archivedCommitments();
        const version = mutationVersion;
        const data = await confirmed(() =>
          firstValueFrom(
            http.get<Commitment[]>(`${API}/archived`, {
              params: { 'ngsw-bypass': 'true' },
            }),
          ),
        );
        if (!Array.isArray(data)) throw new Error('Unable to load archived habits.');
        if (version === mutationVersion) patchState(store, { archivedCommitments: data });
        return data;
      },
      async restoreCommitment(id: string): Promise<void> {
        const target = store.archivedCommitments().find((c) => c.id === id);
        const saved = remote()
          ? record(
              await confirmed(() =>
                firstValueFrom(http.patch<Commitment>(`${API}/${id}/restore`, {})),
              ),
            )
          : target;
        mutationVersion++;
        applyCalendar(saved?.calendar);
        patchState(store, {
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
          commitments: saved
            ? [{ ...saved, isArchived: false }, ...store.commitments().filter((c) => c.id !== id)]
            : store.commitments(),
        });
      },
      async permanentDeleteCommitment(id: string): Promise<void> {
        if (remote()) await confirmed(() => firstValueFrom(http.delete(`${API}/${id}/permanent`)));
        mutationVersion++;
        patchState(store, {
          commitments: store.commitments().filter((c) => c.id !== id),
          archivedCommitments: store.archivedCommitments().filter((c) => c.id !== id),
        });
      },
      resetState(): void {
        sessionVersion++;
        mutationVersion++;
        syncRequest = undefined;
        completionRequests.clear();
        cancelRefresh();
        patchState(store, initialState);
      },
      clearUserStorage(userId: string): void {
        localStorage.removeItem(getUserStorageKey(userId));
        localStorage.removeItem(getUserArchivedStorageKey(userId));
      },
    };
    return methods;
  }),
  withHooks({
    onInit(store) {
      const destroyRef = inject(DestroyRef);
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const resume = () => {
          if (document.visibilityState === 'visible') void store.refreshCalendar();
        };
        const reconnect = () => {
          void store.refreshCalendar();
        };
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('focus', resume);
        window.addEventListener('pageshow', resume);
        window.addEventListener('online', reconnect);
        destroyRef.onDestroy(() => {
          store.stopDayRefresh();
          document.removeEventListener('visibilitychange', resume);
          window.removeEventListener('focus', resume);
          window.removeEventListener('pageshow', resume);
          window.removeEventListener('online', reconnect);
        });
      }
      effect(() => {
        const id = store.activeUserId();
        const data = store.commitments();
        if (id) {
          try {
            localStorage.setItem(getUserStorageKey(id), JSON.stringify(data));
          } catch {
            /* Cache is optional; the server retains saved data. */
          }
        }
      });
      effect(() => {
        const id = store.activeUserId();
        const data = store.archivedCommitments();
        if (id) {
          try {
            localStorage.setItem(getUserArchivedStorageKey(id), JSON.stringify(data));
          } catch {
            /* Cache is optional. */
          }
        }
      });
    },
  }),
);
export type CommitmentStore = InstanceType<typeof CommitmentStore>;
