import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { gsap } from 'gsap';

interface Star {
  left: number;
  originalTop: number;
  currentTop: number;
  size: number;
  opacity: number;

  driftX: number;
  driftY: number;
  driftSpeedX: number;
  driftSpeedY: number;
  phase: number;

  velocityX: number;
  velocityY: number;
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
  private mouseX = 0;
  private mouseY = 0;
  private prevMouseX = 0;
  private prevMouseY = 0;
  private mouseVelocityX = 0;
  private mouseVelocityY = 0;
  private time = 0;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
    this.animate();
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    try {
      const els = this.starEls?.map((r) => r.nativeElement) ?? [];
      if (els.length) gsap.killTweensOf(els);
    } catch {}
  }

  private handleResize = () => {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  private generate(): void {
    const w = window.innerWidth;
    const h = this.tileHeight;

    const count = Math.floor(w * h * 0.000055);
    const stars: Star[] = [];

    for (let tile = 0; tile < 3; tile++) {
      for (let i = 0; i < count; i++) {
        const originalTop = Math.random() * h + tile * h - h;
        stars.push({
          left: Math.random() * w,
          originalTop,
          currentTop: originalTop,
          size: Math.random() * 7 + 1.5,
          opacity: 0.3 + Math.random() * 0.5,

          driftX: 0,
          driftY: 0,
          driftSpeedX: (Math.random() - 0.5) * 0.8,
          driftSpeedY: (Math.random() - 0.5) * 0.8,
          phase: Math.random() * Math.PI * 2,

          velocityX: 0,
          velocityY: 0,
        });
      }
    }

    this.stars = stars;
    this.cdr.markForCheck();
  }

  private animate = () => {
    const scrollY = window.scrollY;
    this.time += 0.016;

    const instantMouseVelX = this.mouseX - this.prevMouseX;
    const instantMouseVelY = this.mouseY - this.prevMouseY;

    const smoothingFactor = 0.15;
    this.mouseVelocityX += (instantMouseVelX - this.mouseVelocityX) * smoothingFactor;
    this.mouseVelocityY += (instantMouseVelY - this.mouseVelocityY) * smoothingFactor;

    const els = this.starEls?.toArray() ?? [];

    this.stars.forEach((star, i) => {
      star.currentTop = star.originalTop - scrollY;

      if (star.currentTop < -this.tileHeight) {
        star.originalTop += this.tileHeight * 3;
        star.currentTop += this.tileHeight * 3;
      } else if (star.currentTop > this.tileHeight * 2) {
        star.originalTop -= this.tileHeight * 3;
        star.currentTop -= this.tileHeight * 3;
      }

      const driftAmount = 40;
      star.driftX = Math.sin(this.time * star.driftSpeedX + star.phase) * driftAmount;
      star.driftY = Math.cos(this.time * star.driftSpeedY + star.phase) * driftAmount;

      const el = els[i]?.nativeElement;
      if (el) {
        const distToMouseX = star.left - this.mouseX;
        const distToMouseY = star.currentTop - this.mouseY;
        const distToMouse = Math.sqrt(distToMouseX * distToMouseX + distToMouseY * distToMouseY);

        const influenceRadius = 200;

        if (distToMouse < influenceRadius && distToMouse > 0) {
          const influenceFactor = 1 - distToMouse / influenceRadius;

          const velocityTransfer = 0.33;
          star.velocityX += this.mouseVelocityX * influenceFactor * velocityTransfer;
          star.velocityY += this.mouseVelocityY * influenceFactor * velocityTransfer;
        }

        const damping = 0.98;
        star.velocityX *= damping;
        star.velocityY *= damping;

        const maxOffset = 1000;
        const currentOffsetX = star.velocityX;
        const currentOffsetY = star.velocityY;
        const currentOffsetMagnitude = Math.sqrt(
          currentOffsetX * currentOffsetX + currentOffsetY * currentOffsetY
        );

        if (currentOffsetMagnitude > maxOffset) {
          const returnForce = 0.02;
          star.velocityX -=
            (currentOffsetX / currentOffsetMagnitude) *
            returnForce *
            (currentOffsetMagnitude - maxOffset);
          star.velocityY -=
            (currentOffsetY / currentOffsetMagnitude) *
            returnForce *
            (currentOffsetMagnitude - maxOffset);
        }

        const totalX = star.driftX + star.velocityX;
        const totalY = star.driftY + star.velocityY;

        el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0)`;
      }
    });

    this.cdr.markForCheck();
    this.rafId = requestAnimationFrame(this.animate);
  };
}
