import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BlobAnimationConfigService } from '../../shared/services/blob-animation-config.service';
import { BUBBLES, DESKTOP_POSITIONS, MOBILE_POSITIONS } from './constants';

interface SkillData {
  name: string;
  description: string;
  icon: string;

  iconInitialX?: number;
  iconInitialY?: number;
  iconScale?: number;
}

interface BubbleConfig {
  id: string;
  src: string;

  originalWidth: number;
  originalHeight: number;

  originalX: number;
  originalY: number;

  skill_desktop?: SkillData;
  skill_mobile?: SkillData;
}

interface Bubble extends BubbleConfig {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface BlobSyncPayload {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

@Component({
  selector: 'app-skills',
  imports: [],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '(window:resize)': 'onResize()',
  },
})
export class Skills implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef', { static: false }) sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('titleRef', { static: false }) titleRef!: ElementRef<HTMLElement>;
  @ViewChild('skillInfo', { static: false }) skillInfo!: ElementRef<HTMLElement>;
  @ViewChild('reverseBlobRef', { static: false }) reverseBlobRef!: ElementRef<HTMLImageElement>;
  @ViewChildren('bubbleImg') bubbleImgs!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChildren('bubbleIcon') bubbleIcons!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChildren('bubbleContainer') bubbleContainers!: QueryList<ElementRef<HTMLDivElement>>;

  private titleScrollTrigger?: ScrollTrigger;
  private bubblesScrollTrigger?: ScrollTrigger;
  private phase1ScrollTrigger?: ScrollTrigger;
  private phase2ScrollTrigger?: ScrollTrigger;
  private phase3ScrollTrigger?: ScrollTrigger;
  private phase4ScrollTrigger?: ScrollTrigger;
  private phase5ScrollTrigger?: ScrollTrigger;
  private skillInfoScrollTrigger?: ScrollTrigger;
  private interactionCleanups: Array<() => void> = [];

  private updateReverseBlobPositionBound = () => {
    if (this.reverseBlobRef?.nativeElement) {
      const isMobile = this.config.isMobile();
      const reverseBlob = this.reverseBlobRef.nativeElement;

      const expected = this.config.calculateExpectedBlobDimensions();
      const blobWidth = reverseBlob.offsetWidth || expected.width;
      const blobHeight = reverseBlob.offsetHeight || expected.height;

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = this.config.getAdjustedCenterY();

      gsap.set(reverseBlob, {
        x: viewportCenterX - blobWidth / 2,
        y: viewportCenterY - blobHeight / 2,
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
        force3D: true,
      });
    }
  };

  selectedSkill = signal<SkillData>({
    name: 'Angular',
    description:
      'Construcción de aplicaciones web dinámicas con componentes reutilizables. Implementación de servicios, routing y binding de datos eficiente.',
    icon: 'assets/skills/icons/angular.webp',
  });

  constructor(private readonly config: BlobAnimationConfigService) {}

  private emitSkillsBlobFinished(detail: BlobSyncPayload): void {
    document.dispatchEvent(new CustomEvent<BlobSyncPayload>('skills-blob-finished', { detail }));
  }

  private emitSkillsBlobReset(): void {
    document.dispatchEvent(new Event('skills-blob-reset'));
  }

  private emitSkillsBlobTakeover(): void {
    document.dispatchEvent(new Event('skills-blob-takeover'));
  }

  private getSkill(bubble: Bubble, isMobile: boolean): SkillData | undefined {
    return isMobile ? bubble.skill_mobile : bubble.skill_desktop;
  }

  hasSkill(bubble: Bubble): boolean {
    const isMobile = this.config.isMobile();
    return !!this.getSkill(bubble, isMobile);
  }

  getSkillForBubble(bubble: Bubble): SkillData | undefined {
    const isMobile = this.config.isMobile();
    return this.getSkill(bubble, isMobile);
  }

  get SKILLS_SCROLL_HEIGHT(): number {
    const isMobile = this.config.isMobile();

    const phase1 = isMobile ? 500 : 700;
    const phase2 = 200;
    const phase3 = isMobile ? 800 : 1000;
    const phase4 = isMobile ? 800 : 1000;
    const phase5 = this.config.SEQUENCE_DURATION;

    return phase1 + phase2 + phase3 + phase4 + phase5 + 100;
  }

  bubbles: Bubble[] = BUBBLES as Bubble[];

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    const waitForBlobDimensions = () => {
      this.calculateBubblePositions();
      this.setupBubblesAnimation();
      this.setupPhase1Animation();
      this.setupPhase2Animation();
      this.setupPhase3Animation();
      this.setupPhase4Animation();
      this.setupPhase5Animation();
      this.clearInteractionListeners();
      this.setupBubbleInteractions();
    };

    waitForBlobDimensions();

    requestAnimationFrame(() => waitForBlobDimensions());
    setTimeout(() => waitForBlobDimensions(), 100);
    setTimeout(() => waitForBlobDimensions(), 500);

    if (this.reverseBlobRef?.nativeElement) {
      const img = this.reverseBlobRef.nativeElement;
      if (!img.complete) {
        img.addEventListener('load', this.updateReverseBlobPositionBound, { once: true });
      } else {
        this.updateReverseBlobPositionBound();
      }
    }
  }

  private resizeTimeout: any;

  onResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      this.calculateBubblePositions();

      this.setupBubblesAnimation();
      this.setupPhase1Animation();
      this.setupPhase2Animation();
      this.setupPhase3Animation();
      this.setupPhase4Animation();
      this.setupPhase5Animation();
      this.clearInteractionListeners();
      this.setupBubbleInteractions();

      ScrollTrigger.refresh();
      this.updateReverseBlobPositionBound();
    }, 250);
  }

  private getNavbarHeight(): number {
    return this.config.getNavbarHeight();
  }

  private getAdjustedCenterY(): number {
    return this.config.getAdjustedCenterY();
  }

  private calculateBubblePositions(): void {
    if (!(this.config as any)['initialBlobDimensions']) {
      const aboutBlob = document.querySelector('[alt="3D blob"]') as HTMLImageElement;
      if (aboutBlob && aboutBlob.offsetWidth > 0 && aboutBlob.offsetHeight > 0) {
        this.config.setInitialBlobDimensions(aboutBlob.offsetWidth, aboutBlob.offsetHeight);
      } else {
        this.config.calculateExpectedBlobDimensions();
      }
    }

    const isMobile = this.config.isMobile();
    const finalBlobWidth = this.config.getFinalBlobWidth(isMobile);

    let scale = this.config.getBlobScale(isMobile);

    if (scale <= 0 || !isFinite(scale)) {
      console.warn('Invalid scale calculated:', scale, 'Using fallback 1.0');
      scale = 1.0;
    }

    if (this.reverseBlobRef?.nativeElement) {
      const reverseBlob = this.reverseBlobRef.nativeElement;

      const expected = this.config.calculateExpectedBlobDimensions();
      const blobWidth = reverseBlob.offsetWidth || expected.width;
      const blobHeight = reverseBlob.offsetHeight || expected.height;

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = this.config.getAdjustedCenterY();

      gsap.set(reverseBlob, {
        x: viewportCenterX - blobWidth / 2,
        y: viewportCenterY - blobHeight / 2,
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
        force3D: true,
      });
    }

    const centerX = window.innerWidth / 2;
    const centerY = this.getAdjustedCenterY();

    const finalBlobHeight = this.config.ORIGINAL_BLOB_HEIGHT * scale;

    const blobStartX = centerX - finalBlobWidth / 2;
    const blobStartY = centerY - finalBlobHeight / 2;

    const blobCenterX = centerX;
    const blobCenterY = centerY;

    this.bubbles.forEach((bubble) => {
      bubble.width = Math.max(bubble.originalWidth * scale, 1);
      bubble.height = Math.max(bubble.originalHeight * scale, 1);

      let scaledX = bubble.originalX * scale;
      let scaledY = bubble.originalY * scale;

      if (isMobile) {
        const relativeX =
          bubble.originalX + bubble.originalWidth / 2 - this.config.ORIGINAL_BLOB_WIDTH / 2;
        const relativeY =
          bubble.originalY + bubble.originalHeight / 2 - this.config.ORIGINAL_BLOB_HEIGHT / 2;

        const rotatedRelativeX = -relativeY;
        const rotatedRelativeY = relativeX;

        const scaledRotatedX = rotatedRelativeX * scale;
        const scaledRotatedY = rotatedRelativeY * scale;

        scaledX = scaledRotatedX - bubble.width / 2;
        scaledY = scaledRotatedY - bubble.height / 2;

        bubble.x = blobCenterX + scaledX;
        bubble.y = blobCenterY + scaledY;
      } else {
        bubble.x = blobStartX + scaledX;
        bubble.y = blobStartY + scaledY;
      }
    });
  }

  private setupPhase1Animation(): void {
    const title = this.titleRef?.nativeElement;
    const section = this.sectionRef?.nativeElement;
    if (!title || !section) return;

    if (this.phase1ScrollTrigger) {
      this.phase1ScrollTrigger.kill();
      this.phase1ScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();
    const layout = this.config.getSkillsLayoutConfig(isMobile);

    this.phase1ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: `+=${isMobile ? 500 : 700}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const startY = window.innerHeight / 2;
        const currentTitleY = startY - self.progress * (startY - layout.titleFinalY);

        gsap.set(title, {
          y: currentTitleY,
          opacity: Math.min(1, self.progress * 2),
        });

        if (this.bubbleContainers && this.bubbleIcons) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex =
                this.bubbles.slice(0, index + 1).filter((b) => this.getSkill(b, isMobile)).length -
                1;

              const allSkillBubbles = this.bubbles.filter((b) => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map((b) => b.y));
              const maxY = Math.max(...allSkillBubbles.map((b) => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const targetY = bubble.y + groupOffset;

              const moveY = (targetY - bubble.y) * self.progress;

              gsap.set(container, {
                x: bubble.x,
                y: bubble.y + moveY,
                autoAlpha: 1,
              });

              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                const delay = skillIndex * 0.08;
                const iconProgress = Math.max(
                  0,
                  Math.min(1, (self.progress - delay) / (1 - delay))
                );
                gsap.set(iconRef.nativeElement, {
                  opacity: iconProgress,
                });
              }
            } else {
              const targetY = bubble.y + window.innerHeight * 1.5;
              const moveY = (targetY - bubble.y) * self.progress;

              gsap.set(container, {
                x: bubble.x,
                y: bubble.y + moveY,
                autoAlpha: Math.max(0, 1 - self.progress * 1.2),
              });
            }
          });
        }
      },
    });
  }

  private setupPhase2Animation(): void {
    const title = this.titleRef?.nativeElement;
    const section = this.sectionRef?.nativeElement;
    if (!title || !section) return;

    if (this.phase2ScrollTrigger) {
      this.phase2ScrollTrigger.kill();
      this.phase2ScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();
    const layout = this.config.getSkillsLayoutConfig(isMobile);

    this.phase2ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 500 : 700}`,
      end: `+=200`,
      scrub: true,
      markers: false,
      id: 'skills-anchor',
      invalidateOnRefresh: true,
      onUpdate: () => {
        gsap.set(title, {
          y: layout.titleFinalY,
          opacity: 1,
        });

        if (this.bubbleContainers && this.bubbleIcons) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex =
                this.bubbles.slice(0, index + 1).filter((b) => this.getSkill(b, isMobile)).length -
                1;

              const allSkillBubbles = this.bubbles.filter((b) => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map((b) => b.y));
              const maxY = Math.max(...allSkillBubbles.map((b) => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const targetY = bubble.y + groupOffset;

              gsap.set(container, {
                x: bubble.x,
                y: targetY,
                autoAlpha: 1,
              });

              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, { opacity: 1 });
              }
            } else {
              gsap.set(container, {
                autoAlpha: 0,
              });
            }
          });
        }
      },
    });
  }

  private setupPhase3Animation(): void {
    const title = this.titleRef?.nativeElement;
    const section = this.sectionRef?.nativeElement;
    const skillInfo = this.skillInfo?.nativeElement;
    if (!title || !section) return;

    if (this.phase3ScrollTrigger) {
      this.phase3ScrollTrigger.kill();
      this.phase3ScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();
    const layout = this.config.getSkillsLayoutConfig(isMobile);
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - layout.navbarHeight;

    this.phase3ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 700 : 900}`,
      end: `+=${isMobile ? 800 : 1000}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const titleDisappearY = layout.titleFinalY - (layout.titleHeight + 100);
        const currentTitleY =
          layout.titleFinalY - self.progress * Math.abs(layout.titleFinalY - titleDisappearY);

        gsap.set(title, {
          y: currentTitleY,
          opacity: 1,
        });

        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex =
                this.bubbles.slice(0, index + 1).filter((b) => this.getSkill(b, isMobile)).length -
                1;

              const allSkillBubbles = this.bubbles.filter((b) => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map((b) => b.y));
              const maxY = Math.max(...allSkillBubbles.map((b) => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const startY = bubble.y + groupOffset;

              if (isMobile) {
                const mobilePos = MOBILE_POSITIONS[skillIndex];
                const margin = 20;

                const lowerHalfStart = layout.navbarHeight + availableHeight / 2;
                const lowerHalfHeight = availableHeight / 2;

                const finalX = margin + mobilePos.x * (availableWidth - margin * 2 - bubble.width);
                const finalY =
                  lowerHalfStart +
                  margin +
                  mobilePos.y * (lowerHalfHeight - margin * 2 - bubble.height);

                const moveX = (finalX - bubble.x) * self.progress;
                const moveY = (finalY - startY) * self.progress;

                gsap.set(container, {
                  x: bubble.x + moveX,
                  y: startY + moveY,
                  autoAlpha: 1,
                });
              } else {
                const desktopPos = DESKTOP_POSITIONS[skillIndex];
                const rightHalfStart = availableWidth / 2;
                const rightHalfWidth = availableWidth / 2;
                const margin = 60;

                const finalX =
                  rightHalfStart + margin + desktopPos.x * (rightHalfWidth - margin * 2);
                const finalY =
                  layout.navbarHeight + margin + desktopPos.y * (availableHeight - margin * 2);

                const moveX = (finalX - bubble.x) * self.progress;
                const moveY = (finalY - startY) * self.progress;

                gsap.set(container, {
                  x: bubble.x + moveX,
                  y: startY + moveY,
                  autoAlpha: 1,
                });
              }

              const img = this.bubbleImgs.toArray()[index]?.nativeElement;
              if (img) {
                gsap.set(img, {
                  rotation: this.config.getFinalRotation(isMobile),
                });
              }

              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, {
                  rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
                });
              }
            }
          });
        }

        if (skillInfo) {
          const textProgress = Math.max(0, (self.progress - 0.6) / 0.4);
          gsap.set(skillInfo, {
            opacity: textProgress,
          });
        }
      },
      onRefresh: (self) => {
        if (skillInfo) {
          const textProgress = Math.max(0, (self.progress - 0.6) / 0.4);
          gsap.set(skillInfo, {
            opacity: textProgress,
          });
        }
      },
    });
  }

  private setupPhase4Animation(): void {
    const section = this.sectionRef?.nativeElement;
    const skillInfo = this.skillInfo?.nativeElement;
    if (!section) return;

    if (this.phase4ScrollTrigger) {
      this.phase4ScrollTrigger.kill();
      this.phase4ScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();
    const layout = this.config.getSkillsLayoutConfig(isMobile);
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - layout.navbarHeight;

    this.phase4ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 1500 : 1900}`,
      end: `+=${isMobile ? 800 : 1000}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (skillInfo) {
          gsap.set(skillInfo, { opacity: Math.max(0, 1 - self.progress * 4) });
        }

        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex =
                this.bubbles.slice(0, index + 1).filter((b) => this.getSkill(b, isMobile)).length -
                1;

              let startX = bubble.x;
              let startY = bubble.y;

              const allSkillBubbles = this.bubbles.filter((b) => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map((b) => b.y));
              const maxY = Math.max(...allSkillBubbles.map((b) => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const phase2Y = bubble.y + groupOffset;

              if (isMobile) {
                const mobilePos = MOBILE_POSITIONS[skillIndex];
                const margin = 20;
                const lowerHalfStart = layout.navbarHeight + availableHeight / 2;
                const lowerHalfHeight = availableHeight / 2;
                startX = margin + mobilePos.x * (availableWidth - margin * 2 - bubble.width);
                startY =
                  lowerHalfStart +
                  margin +
                  mobilePos.y * (lowerHalfHeight - margin * 2 - bubble.height);
              } else {
                const desktopPos = DESKTOP_POSITIONS[skillIndex];
                const rightHalfStart = availableWidth / 2;
                const rightHalfWidth = availableWidth / 2;
                const margin = 60;
                startX = rightHalfStart + margin + desktopPos.x * (rightHalfWidth - margin * 2);
                startY =
                  layout.navbarHeight + margin + desktopPos.y * (availableHeight - margin * 2);
              }

              const currentX = startX + (bubble.x - startX) * self.progress;
              const currentY = startY + (bubble.y - startY) * self.progress;

              gsap.set(container, {
                x: currentX,
                y: currentY,
                autoAlpha: 1,
              });

              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, {
                  opacity: Math.max(0, 1 - self.progress * 2),
                  rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
                });
              }
            } else {
              const startY = bubble.y + window.innerHeight * 1.5;

              const currentY = startY + (bubble.y - startY) * self.progress;

              gsap.set(container, {
                x: bubble.x,
                y: currentY,
                autoAlpha: self.progress,
              });
            }
          });
        }
      },
    });
  }

  private setupPhase5Animation(): void {
    const section = this.sectionRef?.nativeElement;
    const reverseBlob = this.reverseBlobRef?.nativeElement;
    if (!section || !reverseBlob) return;

    if (this.phase5ScrollTrigger) {
      this.phase5ScrollTrigger.kill();
      this.phase5ScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();
    const totalImages = 25;
    const getBlobPayload = (): BlobSyncPayload => {
      const expected = this.config.calculateExpectedBlobDimensions();
      const blobWidth = reverseBlob.offsetWidth || expected.width;
      const blobHeight = reverseBlob.offsetHeight || expected.height;
      return {
        centerX: window.innerWidth / 2,
        centerY: this.config.getAdjustedCenterY(),
        width: blobWidth,
        height: blobHeight,
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
      };
    };

    const phase5Duration = this.config.SEQUENCE_DURATION;

    this.phase5ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 2300 : 2900}`,
      end: `+=${phase5Duration}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onEnter: () => {
        gsap.set(reverseBlob, { opacity: 1 });
      },
      onEnterBack: () => {
        gsap.set(reverseBlob, { opacity: 1 });
        this.emitSkillsBlobTakeover();
      },
      onLeave: () => {
        gsap.set(reverseBlob, { opacity: 0 });
        this.emitSkillsBlobFinished(getBlobPayload());
      },
      onLeaveBack: () => {
        gsap.set(reverseBlob, { opacity: 0 });
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 1 });
          });
        }
        this.emitSkillsBlobReset();
      },
      onUpdate: (self) => {
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 0 });
          });
        }

        const expected = this.config.calculateExpectedBlobDimensions();
        const blobWidth = reverseBlob.offsetWidth || expected.width;
        const blobHeight = reverseBlob.offsetHeight || expected.height;

        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = this.config.getAdjustedCenterY();

        gsap.set(reverseBlob, {
          opacity: 1,
          scale: this.config.BLOB_SCALE,
          rotation: this.config.getFinalRotation(isMobile),
          x: viewportCenterX - blobWidth / 2,
          y: viewportCenterY - blobHeight / 2,
          force3D: true,
        });

        const imageIndex = Math.floor((1 - self.progress) * totalImages) + 1;
        const clampedIndex = Math.min(Math.max(imageIndex, 1), totalImages);
        const imageNumber = String(clampedIndex).padStart(2, '0');

        reverseBlob.src = `assets/3d_shape/${imageNumber}.webp`;
      },
    });
  }

  private setupBubblesAnimation(): void {
    const section = this.sectionRef?.nativeElement;
    const title = this.titleRef?.nativeElement;
    if (!section || !title) return;

    if (this.bubblesScrollTrigger) {
      this.bubblesScrollTrigger.kill();
      this.bubblesScrollTrigger = undefined;
    }

    const isMobile = this.config.isMobile();

    if (this.bubbleContainers) {
      this.bubbleContainers.forEach((containerRef, index) => {
        const bubble = this.bubbles[index];
        const container = containerRef.nativeElement;

        gsap.set(container, {
          x: bubble.x,
          y: bubble.y,
          width: bubble.width,
          height: bubble.height,
          autoAlpha: 0,
          force3D: true,
        });
      });
    }

    this.bubbleImgs.forEach((ref, index) => {
      const img = ref.nativeElement;

      gsap.set(img, {
        rotation: this.config.getFinalRotation(isMobile),
        opacity: 0,
        force3D: true,
      });
    });

    if (this.bubbleIcons) {
      let iconIndex = 0;
      this.bubbles.forEach((bubble, bubbleIndex) => {
        const skill = this.getSkill(bubble, isMobile);
        if (skill) {
          const iconRef = this.bubbleIcons.toArray()[iconIndex];
          if (!iconRef) return;

          const icon = iconRef.nativeElement;
          const baseIconSize = bubble.width * 0.4;
          const iconScale = skill.iconScale || 1;
          const iconSize = baseIconSize * iconScale;

          const scale = this.config.getBlobScale(isMobile);
          const initialX = (skill.iconInitialX || 0) * scale;
          const initialY = (skill.iconInitialY || 0) * scale;

          gsap.set(icon, {
            width: iconSize,
            height: iconSize,

            rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
            opacity: 0,

            left: `calc(50% + ${initialX}px)`,
            top: `calc(50% + ${initialY}px)`,
            force3D: true,
          });

          iconIndex++;
        }
      });
    }

    this.bubblesScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'top center',
      markers: false,
      invalidateOnRefresh: true,
      onEnter: () => {
        gsap.set(title, { opacity: 1 });

        this.bubbleImgs.forEach((ref) => {
          gsap.set(ref.nativeElement, { opacity: 1 });
        });

        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 1 });
          });
        }
      },
      onLeaveBack: () => {
        gsap.set(title, { opacity: 0 });

        this.bubbleImgs.forEach((ref) => {
          gsap.set(ref.nativeElement, { opacity: 0 });
        });

        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 0 });
          });
        }

        if (this.bubbleIcons) {
          this.bubbleIcons.forEach((iconRef) => {
            gsap.set(iconRef.nativeElement, { opacity: 0 });
          });
        }
      },
    });

    const sectionTop = section.getBoundingClientRect().top;
    const centerY = window.innerHeight / 2;

    const isPastStart = sectionTop <= centerY;

    gsap.set(title, { opacity: isPastStart ? 1 : 0 });
    this.bubbleImgs.forEach((ref) => {
      gsap.set(ref.nativeElement, { opacity: isPastStart ? 1 : 0 });
    });

    if (this.bubbleContainers) {
      this.bubbleContainers.forEach((containerRef) => {
        gsap.set(containerRef.nativeElement, { autoAlpha: isPastStart ? 1 : 0 });
      });
    }

    if (!isPastStart && this.bubbleIcons) {
      this.bubbleIcons.forEach((iconRef) => {
        gsap.set(iconRef.nativeElement, { opacity: 0 });
      });
    }
  }

  private setupBubbleInteractions(): void {
    if (!this.bubbleContainers) return;

    const isMobile = this.config.isMobile();

    this.bubbleContainers.forEach((containerRef, index) => {
      const container = containerRef.nativeElement;
      const bubble = this.bubbles[index];
      const skill = this.getSkill(bubble, isMobile);

      if (skill) {
        const img = this.bubbleImgs.toArray()[index]?.nativeElement;
        const iconRefs = this.bubbleIcons.toArray();
        let iconIndex = 0;
        for (let i = 0; i <= index; i++) {
          if (this.getSkill(this.bubbles[i], isMobile)) {
            if (i === index) break;
            iconIndex++;
          }
        }
        const icon = iconRefs[iconIndex]?.nativeElement;

        if (!img) return;

        const hoverTimeline = gsap.timeline({ paused: true });

        const elementsToAnimate = icon ? [img, icon] : [img];

        hoverTimeline.to(elementsToAnimate, {
          scale: 1.1,
          duration: 0.5,
          ease: 'power2.out',
        });

        const onEnter = () => hoverTimeline.play();
        const onLeave = () => hoverTimeline.reverse();
        container.addEventListener('mouseenter', onEnter);
        container.addEventListener('mouseleave', onLeave);
        this.interactionCleanups.push(() => {
          container.removeEventListener('mouseenter', onEnter);
          container.removeEventListener('mouseleave', onLeave);
        });

        const onClick = () => {
          this.selectedSkill.set(skill);

          gsap
            .timeline()
            .to(elementsToAnimate, {
              scale: 1.15,
              duration: 0.15,
              ease: 'power2.out',
            })
            .to(elementsToAnimate, {
              scale: 1,
              duration: 0.35,
              ease: 'back.out(1.4)',
            });
        };
        container.addEventListener('click', onClick);
        this.interactionCleanups.push(() => {
          container.removeEventListener('click', onClick);
        });
      }
    });
  }

  selectSkill(bubble: Bubble): void {
    const isMobile = this.config.isMobile();
    const skill = this.getSkill(bubble, isMobile);
    if (skill) {
      this.selectedSkill.set(skill);
    }
  }

  getAnchorScrollPosition(): number {
    const section = this.sectionRef?.nativeElement;
    if (!section) return 0;

    const isMobile = window.innerWidth < 640;
    const sectionTop = section.offsetTop;
    const viewportCenter = window.innerHeight / 2;

    const phase1Duration = isMobile ? 500 : 700;

    return sectionTop - viewportCenter + phase1Duration;
  }

  ngOnDestroy(): void {
    this.clearInteractionListeners();
    if (this.titleScrollTrigger) {
      this.titleScrollTrigger.kill();
    }
    if (this.bubblesScrollTrigger) {
      this.bubblesScrollTrigger.kill();
    }
    if (this.phase1ScrollTrigger) {
      this.phase1ScrollTrigger.kill();
    }
    if (this.phase2ScrollTrigger) {
      this.phase2ScrollTrigger.kill();
    }
    if (this.phase3ScrollTrigger) {
      this.phase3ScrollTrigger.kill();
    }
    if (this.phase4ScrollTrigger) {
      this.phase4ScrollTrigger.kill();
    }
    if (this.phase5ScrollTrigger) {
      this.phase5ScrollTrigger.kill();
    }
    if (this.skillInfoScrollTrigger) {
      this.skillInfoScrollTrigger.kill();
    }
  }

  private clearInteractionListeners(): void {
    if (this.interactionCleanups.length) {
      this.interactionCleanups.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      this.interactionCleanups = [];
    }
  }
}
