import { Component } from '@angular/core';
import { LucideAngularModule, Github, Linkedin } from 'lucide-angular';
import { LINKS } from '../shared/constants/links.constant';

@Component({
  selector: 'app-footer',
  imports: [LucideAngularModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly GithubIcon = Github;
  readonly LinkedinIcon = Linkedin;
  readonly currentYear = new Date().getFullYear();
  readonly LINKS = LINKS;
}
