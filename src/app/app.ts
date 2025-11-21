import { Component, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './presentation/shared/components/navbar/navbar';
import { StarfieldComponent } from './presentation/shared/components/starfield/starfield';
import { FaviconService } from './presentation/shared/services/favicon.service';
import { ReminderSplashComponent } from './presentation/shared/components/reminder-splash/reminder-splash';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, StarfieldComponent, ReminderSplashComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('portafolio');
  protected readonly showSplash = signal(true);
  protected readonly canvaUrl = signal(
    'https://www.canva.com/design/DAG5Tj7_cqU/hAFIV5EKM704ncfbM6IMOw/edit?utm_content=DAG5Tj7_cqU&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton'
  );

  private readonly _favicon = inject(FaviconService);
  private readonly _doc = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const body = this._doc?.body;
      if (!body) return;
      if (this.showSplash()) body.classList.add('overflow-hidden');
      else body.classList.remove('overflow-hidden');
    });
  }
}
