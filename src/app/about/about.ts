import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LucideAngularModule, MailIcon, BookOpenIcon, GithubIcon, LinkedinIcon } from 'lucide-angular';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LINKS } from '../shared/constants/links.constant';

@Component({
  selector: 'app-about',
  imports: [LucideAngularModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class About implements AfterViewInit, OnDestroy {
  readonly MailIcon = MailIcon;
  readonly BookOpenIcon = BookOpenIcon;
  readonly GithubIcon = GithubIcon;
  readonly LinkedinIcon = LinkedinIcon;
  readonly LINKS = LINKS;

  @ViewChild('leadRef', { static: false }) leadRef!: ElementRef<HTMLElement>;
  @ViewChild('titleRef', { static: false }) titleRef!: ElementRef<HTMLElement>;
  @ViewChild('subtitleRef', { static: false }) subtitleRef!: ElementRef<HTMLElement>;
  @ViewChild('jelliesRef', { static: false }) jelliesRef!: ElementRef<HTMLDivElement>;
  @ViewChild('jelliesMobileRef', { static: false }) jelliesMobileRef!: ElementRef<HTMLDivElement>;
  @ViewChild('textContainer', { static: false }) textContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('jelly') jellies!: QueryList<ElementRef<HTMLAnchorElement>>;
  @ViewChild('shapeRef', { static: false }) shapeRef!: ElementRef<HTMLImageElement>;
  @ViewChild('profileRef', { static: false }) profileRef!: ElementRef<HTMLImageElement>;

  maxTextWidth = 0;
  private timelines = new Map<HTMLElement, gsap.core.Timeline>();
  private shapeScrollTrigger?: ScrollTrigger;
  private ro?: ResizeObserver;
  private updateShapePositionBound = () => this.updateShapePosition();
  
  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.deferMeasure();
    this.setupJellyAnims();
    this.setupShapeScrollAnim();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncWidth();
    this.updateShapePosition();
  }

  private syncWidth(): void {
    const isMobile = window.innerWidth < 640;
    
    let w = 0;
    if (isMobile && this.textContainer?.nativeElement) {
      w = this.textContainer.nativeElement.offsetWidth;
    } else {
      const candidates: Array<HTMLElement | undefined> = [
        this.leadRef?.nativeElement,
        this.titleRef?.nativeElement,
        this.subtitleRef?.nativeElement,
      ];
      const widths = candidates
        .filter((el): el is HTMLElement => !!el)
        .map((el) => this.maxContentLineWidth(el));
      w = widths.length ? Math.max(...widths) : 0;
    }
    
    if (w && w !== this.maxTextWidth) {
      this.maxTextWidth = w;
      this.cdr.markForCheck();
    }
  }

  private setupJellyAnims(): void {
    this.jellies.forEach((ref) => {
      const el = ref.nativeElement;
      const img = el.querySelector('img');
      const icon = el.querySelector('lucide-icon');
      if (!img || !icon) return;

      const tl = gsap
        .timeline({ paused: true })
        .to([img, icon], { y: -8, rotate: 4, duration: 0.25, ease: 'power2.out' })
        .to([img, icon], { y: -4, rotate: -2, duration: 0.18, ease: 'power1.out' })
        .to([img, icon], { y: 0, rotate: 0, duration: 0.22, ease: 'power1.out' });

      this.timelines.set(el, tl);
      el.addEventListener('mouseenter', () => tl.play(0));
      el.addEventListener('mouseleave', () => tl.reverse());
      el.addEventListener('focus', () => tl.play(0));
      el.addEventListener('blur', () => tl.reverse());
    });
  }

  private deferMeasure(): void {
    const measure = () => this.syncWidth();
    queueMicrotask(measure);
    requestAnimationFrame(measure);
    setTimeout(measure, 0);
    (document as any).fonts?.ready?.then?.(() => measure());
    window.addEventListener('load', measure, { once: true });
  }

  private maxContentLineWidth(el: HTMLElement): number {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = Array.from(range.getClientRects());
      if (rects.length) {
        const max = rects.reduce((m, r) => (r.width > m ? r.width : m), 0);
        return Math.ceil(max);
      }
      return Math.ceil(el.getBoundingClientRect().width);
    } catch {
      return Math.ceil(el.getBoundingClientRect().width);
    }
  }

  private setupShapeScrollAnim(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    this.ensurePositionObservers();
    this.updateShapePosition();
    requestAnimationFrame(() => this.updateShapePosition());
  }

  private ensurePositionObservers(): void {
    const blob = this.shapeRef?.nativeElement;
    const photo = this.profileRef?.nativeElement;
    const jelliesMobile = this.jelliesMobileRef?.nativeElement;

    if (blob && !blob.complete) {
      blob.addEventListener('load', this.updateShapePositionBound, { once: true });
    }
    if (photo && !photo.complete) {
      photo.addEventListener('load', this.updateShapePositionBound, { once: true });
    }

    window.addEventListener('load', this.updateShapePositionBound, { once: true });

    if (!this.ro && 'ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.updateShapePosition());
      if (photo) this.ro.observe(photo);
      if (jelliesMobile) this.ro.observe(jelliesMobile);
    }
  }

  private updateShapePosition(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    if (this.shapeScrollTrigger) {
      this.shapeScrollTrigger.kill();
    }

    const isMobile = window.innerWidth < 640;
    
    let initialRotation: number;
    let finalRotation: number;
    let initialX = 0;
    let initialY = 0;

    if (isMobile) {
      const jelliesMobile = this.jelliesMobileRef?.nativeElement;
      if (!jelliesMobile) return;
      
      const jelliesRect = jelliesMobile.getBoundingClientRect();
      initialX = (window.innerWidth - img.offsetWidth) / 2;
      initialY = jelliesRect.bottom + 30;
      initialRotation = 90 + 30;
      finalRotation = 90;
    } else {
      const profileImg = this.profileRef?.nativeElement;
      if (!profileImg) return;
      
      const profileRect = profileImg.getBoundingClientRect();
      initialX = profileRect.right + 50 - img.offsetWidth;
      initialY = profileRect.bottom + 0;
      initialRotation = 0;
      finalRotation = 0;
    }
    
    gsap.set(img, {
      x: initialX,
      y: initialY,
      scale: 1,
      rotation: initialRotation,
    });

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    const animation = gsap.to(img, {
      x: viewportCenterX - (img.offsetWidth / 2),
      y: viewportCenterY - (img.offsetHeight / 2),
      scale: 1.6,
      rotation: finalRotation,
      ease: 'none',
      scrollTrigger: {
        trigger: 'section',
        start: 'top top+=100',
        end: '+=1000',
        scrub: true,
        markers: false,
        onRefresh: (self) => {
          self.animation?.invalidate();
        },
      },
    });

    this.shapeScrollTrigger = animation.scrollTrigger as ScrollTrigger;
  }

  ngOnDestroy(): void {
    if (this.shapeScrollTrigger) {
      this.shapeScrollTrigger.kill();
    }
    if (this.ro) {
      this.ro.disconnect();
    }
  }
}