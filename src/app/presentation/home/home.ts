import { Component } from '@angular/core';
import { About } from '../features/about/about';
import { Skills } from '../features/skills/skills';
import { Projects } from '../features/projects/projects';
import { Footer } from '../features/footer/footer';

@Component({
  selector: 'app-home',
  imports: [About, Skills, Projects, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}