import { Injectable, effect, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    const stored = (localStorage.getItem('theme') as ThemeMode | null);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const initial: ThemeMode = stored ?? (prefersDark ? 'dark' : 'light');
    this.mode.set(initial);

    effect(() => {
      const m = this.mode();
      const root = document.documentElement;
      root.classList.toggle('dark', m === 'dark');
      localStorage.setItem('theme', m);
    });
  }

  toggle(): void {
    this.mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }
}
