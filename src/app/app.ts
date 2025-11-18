import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./presentation/shared/components/navbar/navbar";
import { StarfieldComponent } from './presentation/shared/components/starfield/starfield';
import { FaviconService } from './presentation/shared/services/favicon.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, StarfieldComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('portafolio');
  // Instantiate FaviconService to keep favicon in sync with theme
  private readonly _favicon = inject(FaviconService);
}
