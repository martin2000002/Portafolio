import { Component } from '@angular/core';
import { About } from '../about/about';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  imports: [About, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}