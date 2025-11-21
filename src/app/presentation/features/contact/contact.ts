import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LucideAngularModule, Send } from 'lucide-angular';

@Component({
  selector: 'app-contact',
  imports: [LucideAngularModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('formRef') formRef!: ElementRef<HTMLElement>;

  readonly Send = Send;

  private scrollTrigger?: ScrollTrigger;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupAnimations();
  }

  private setupAnimations(): void {
    const section = this.sectionRef.nativeElement;
    const form = this.formRef.nativeElement;

    // Initial state
    gsap.set(form, { opacity: 0, y: 50 });

    // Create timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top center+=100',
        end: 'top center-=100',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // Animate form and blob together
    tl.to(form, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
    })
    this.scrollTrigger = tl.scrollTrigger;
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
  }
}
