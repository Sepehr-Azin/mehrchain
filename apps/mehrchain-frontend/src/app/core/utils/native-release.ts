import { InjectionToken } from '@angular/core';
import { registerPlugin } from '@capacitor/core';

export interface InstalledRelease {
  version: string;
  versionCode: number;
  applicationId: string;
  certificateSha256: string;
  debug: boolean;
}
const plugin = registerPlugin<{ getInfo(): Promise<InstalledRelease> }>('AppRelease');
export const INSTALLED_RELEASE = new InjectionToken<() => Promise<InstalledRelease>>(
  'INSTALLED_RELEASE',
  {
    providedIn: 'root',
    factory: () => () => plugin.getInfo(),
  },
);
