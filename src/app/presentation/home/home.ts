import { Component } from '@angular/core';
import { About } from '../features/about/about';
import { Footer } from '../features/footer/footer';

@Component({
  selector: 'app-home',
  imports: [About, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}