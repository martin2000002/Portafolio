import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { gsap } from 'gsap';
import { LucideAngularModule, ExternalLink, X } from 'lucide-angular';

@Component({
  selector: 'app-reminder-splash',
  imports: [LucideAngularModule],
  templateUrl: './reminder-splash.html',
  styleUrl: './reminder-splash.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderSplashComponent implements AfterViewInit, OnDestroy {
  url = input.required<string>();
  closed = output<void>();

  readonly ExternalLink = ExternalLink;
  readonly X = X;

  @ViewChild('cardRef') private cardRef?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    const card = this.cardRef?.nativeElement;
    if (card) {
      gsap.fromTo(
        card,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }

  onClose(): void {
    const card = this.cardRef?.nativeElement;
    if (card) {
      gsap.to(card, {
        y: 10,
        opacity: 0,
        duration: 0.3,
        ease: 'power1.in',
        onComplete: () => this.closed.emit(),
      });
    } else {
      this.closed.emit();
    }
  }

  ngOnDestroy(): void {}
}
