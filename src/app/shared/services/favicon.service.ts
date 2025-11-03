import { Injectable, effect, inject } from '@angular/core';
import { ThemeService } from './theme.service';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class FaviconService {
  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      const mode = this.theme.mode();
      this.setFavicon(mode);
    });
  }

  private setFavicon(mode: ThemeMode): void {
    const id = 'app-favicon';
    const href = `assets/favicon/${mode === 'dark' ? 'white' : 'black'}.png?v=2`;
    let link = document.getElementById(id) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }

    link.href = href;
  }
}
