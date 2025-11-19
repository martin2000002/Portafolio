import { Component } from '@angular/core';
import { About } from '../features/about/about';
import { Skills } from '../features/skills/skills';
import { Footer } from '../features/footer/footer';

@Component({
  selector: 'app-home',
  imports: [About, Skills, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}