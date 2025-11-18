import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

interface Star { 
  left: number; 
  originalTop: number;
  currentTop: number;
  size: number; 
  opacity: number; 
}

@Component({
  selector: 'app-starfield',
  imports: [],
  templateUrl: './starfield.html',
  styleUrl: './starfield.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarfieldComponent implements AfterViewInit, OnDestroy {
  stars: Star[] = [];
  @ViewChildren('starEl') private starEls?: QueryList<ElementRef<HTMLSpanElement>>;
  
  private tileHeight = 0;
  private rafId?: number;
  
  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
    this.animate();
    queueMicrotask(() => this.applyDrift());
    this.starEls?.changes.subscribe(() => {
      this.applyDrift();
    });
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    try {
      const els = this.starEls?.map((r) => r.nativeElement) ?? [];
      if (els.length) gsap.killTweensOf(els);
    } catch {
    }
  }

  private handleResize = () => {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
    requestAnimationFrame(() => this.applyDrift());
  };

  private generate(): void {
    const w = window.innerWidth;
    const h = this.tileHeight;
    const count = Math.floor((w * h) * 0.00007); // Density of stars
    const stars: Star[] = [];
    
    // 3 tiles for loop
    for (let tile = 0; tile < 3; tile++) {
      for (let i = 0; i < count; i++) {
        const originalTop = Math.random() * h + (tile * h) - h;
        stars.push({
          left: Math.random() * w,
          originalTop,
          currentTop: originalTop,
          size: Math.random() * 4 + 2,
          opacity: 0.4 + Math.random() * 0.6,
        });
      }
    }
    
    this.stars = stars;
    this.cdr.markForCheck();
  }

  private animate = () => {
    const scrollY = window.scrollY;
    
    this.stars.forEach(star => {
      star.currentTop = star.originalTop - scrollY;
      
      if (star.currentTop < -this.tileHeight) {
        star.currentTop += this.tileHeight * 3;
      }
      else if (star.currentTop > this.tileHeight * 2) {
        star.currentTop -= this.tileHeight * 3;
      }
    });
    
    this.cdr.markForCheck();
    this.rafId = requestAnimationFrame(this.animate);
  };

  private applyDrift(): void {
    const els = this.starEls?.map((r) => r.nativeElement) ?? [];
    if (!els.length) return;

    gsap.killTweensOf(els);
    gsap.set(els, { x: 0, y: 0 });

    els.forEach((el) => {
  const xRange = gsap.utils.random(-100, 100, 0.2, true);
  const yRange = gsap.utils.random(-100, 100, 0.2, true);
  const dur = gsap.utils.random(3, 6, 0.1, true);
      const del = gsap.utils.random(0, 1.2, 0.05, true);
      gsap.to(el, {
        x: xRange,
        y: yRange,
        duration: dur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        repeatDelay: 0,
        delay: del,
      });
      // Pulse
      const strongPulse = Math.random() < 0.20;
      if (strongPulse) {
        const scaleDur = gsap.utils.random(2.5, 4.5, 0.05, true);
        const targetScale = gsap.utils.random(0.85, 1.25, 0.01, true);
        gsap.to(el, {
          scale: targetScale,
          duration: scaleDur,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: Number(del) / 2,
          transformOrigin: 'center center',
        });

        // Opacity pulse
        const baseOpacity = Number(el.style.opacity) || 1;
        const minOpacity = Math.max(0.15, baseOpacity * 0.4);
        const maxOpacity = Math.min(1, baseOpacity * 1.1);
        const opaDur = gsap.utils.random(1.8, 3.5, 0.05, true);
        gsap.to(el, {
          opacity: gsap.utils.random(minOpacity, maxOpacity, 0.01, true),
          duration: opaDur,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: Number(del) / 3,
        });
      } else {
        const subtleDur = gsap.utils.random(6, 14, 0.1, true);
        gsap.to(el, {
          scale: gsap.utils.random(0.98, 1.02, 0.01, true),
          duration: subtleDur,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: Number(del) / 4,
          transformOrigin: 'center center',
        });
      }
    });
  }
}
