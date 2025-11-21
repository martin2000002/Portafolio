import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LucideAngularModule, Send } from 'lucide-angular';
import { BlobAnimationConfigService } from '../../shared/services/blob-animation-config.service';

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
  @ViewChild('mobileBlobRef') mobileBlobRef?: ElementRef<HTMLImageElement>;

  readonly Send = Send;
  private readonly config = inject(BlobAnimationConfigService);

  private scrollTrigger?: ScrollTrigger;
  private removeResizeListener?: () => void;
  private removeRefreshListener?: () => void;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupAnimations();
  }

  private setupAnimations(): void {
    const section = this.sectionRef.nativeElement;
    const form = this.formRef.nativeElement;
    const mobileBlob = this.mobileBlobRef?.nativeElement ?? null;
    const isDesktop = window.innerWidth >= 1024;
    const mobileScale = this.config.BLOB_SCALE * 0.66;

    // Initial state
    gsap.set(form, { opacity: 0, y: 50 });
    if (!isDesktop && mobileBlob) {
      this.positionMobileBlob(mobileBlob, mobileScale);
      gsap.set(mobileBlob, { opacity: 0 });
    }

    // Create timeline
    const scrollTriggerConfig: ScrollTrigger.Vars = {
      trigger: section,
      start: 'top bottom',
      end: 'bottom center',
      scrub: true,
      invalidateOnRefresh: true,
    };

    if (!isDesktop && mobileBlob) {
      scrollTriggerConfig.onEnter = () => gsap.set(mobileBlob, { opacity: 1 });
      scrollTriggerConfig.onEnterBack = () => gsap.set(mobileBlob, { opacity: 1 });
      scrollTriggerConfig.onLeave = () => gsap.set(mobileBlob, { opacity: 0 });
      scrollTriggerConfig.onLeaveBack = () => gsap.set(mobileBlob, { opacity: 0 });
    }

    const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

    // Animate form and blob together
    tl.to(form, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
    });

    this.scrollTrigger = tl.scrollTrigger;
  }

  private positionMobileBlob(blob: HTMLImageElement, scale: number): void {
    this.removeResizeListener?.();
    this.removeRefreshListener?.();

    const applyPosition = () => {
      const expected = this.config.calculateExpectedBlobDimensions();
      const width = blob.offsetWidth || expected.width;
      const height = blob.offsetHeight || expected.height;
      const centerX = window.innerWidth / 2;
      const navbarHeight = this.config.getNavbarHeight();
      const availableHeight = window.innerHeight - navbarHeight;
      const centerY = navbarHeight + availableHeight / 2;
      const left = centerX - width / 2;
      const top = centerY - height / 2;

      gsap.set(blob, {
        left,
        top,
        scale,
        rotate: 90,
        transformOrigin: 'center center',
      });
    };

    if (!blob.complete) {
      blob.addEventListener('load', applyPosition, { once: true });
    } else {
      applyPosition();
    }

    const resizeHandler = () => applyPosition();
    window.addEventListener('resize', resizeHandler);
    this.removeResizeListener = () => window.removeEventListener('resize', resizeHandler);

    const refreshHandler = () => applyPosition();
    ScrollTrigger.addEventListener('refresh', refreshHandler);
    this.removeRefreshListener = () => ScrollTrigger.removeEventListener('refresh', refreshHandler);
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.removeResizeListener?.();
    this.removeRefreshListener?.();
  }
}
