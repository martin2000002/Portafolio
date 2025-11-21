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
  // Posición inicial del icono para centrarlo en la bubble (pixel-perfect)
  iconInitialX?: number; // Posición X inicial en píxeles (relativo a 1536x1024)
  iconInitialY?: number; // Posición Y inicial en píxeles (relativo a 1536x1024)
  iconScale?: number; // Escala del icono (1 = 100%, 1.2 = 120%, etc.)
}

interface BubbleConfig {
  id: string;
  src: string;
  // Dimensiones originales de la imagen en la referencia de 1536x1024
  originalWidth: number;
  originalHeight: number;
  // Posición relativa en la imagen original (0-1536, 0-1024)
  // Estos valores son la esquina superior izquierda de cada burbuja
  originalX: number;
  originalY: number;
  // Skills asociadas según la orientación de la pantalla
  skill_desktop?: SkillData; // Skill para desktop (bubbles en 0°)
  skill_mobile?: SkillData;   // Skill para mobile (bubbles rotadas 90°)
}

interface Bubble extends BubbleConfig {
  // Dimensiones calculadas en runtime
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
    '(window:resize)': 'onResize()'
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
  private phase1ScrollTrigger?: ScrollTrigger; // Fase 1: Skills sube, icons aparecen, bubbles se centran
  private phase2ScrollTrigger?: ScrollTrigger; // Fase 2: Todo quieto (punto de anclaje)
  private phase3ScrollTrigger?: ScrollTrigger; // Fase 3: Skills desaparece, bubbles se distribuyen
  private phase4ScrollTrigger?: ScrollTrigger; // Fase 4: Bubbles regresan al centro (cluster)
  private phase5ScrollTrigger?: ScrollTrigger; // Fase 5: Bubbles -> Blob 25 -> Blob 01
  private skillInfoScrollTrigger?: ScrollTrigger;
  private interactionCleanups: Array<() => void> = [];
  
  private updateReverseBlobPositionBound = () => {
    if (this.reverseBlobRef?.nativeElement) {
      const isMobile = this.config.isMobile();
      const reverseBlob = this.reverseBlobRef.nativeElement;
      // Usar dimensiones esperadas si el DOM aún no reporta tamaño (fallback)
      const expected = this.config.calculateExpectedBlobDimensions();
      const blobWidth = reverseBlob.offsetWidth || expected.width;
      const blobHeight = reverseBlob.offsetHeight || expected.height;

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = this.config.getAdjustedCenterY();
      
      gsap.set(reverseBlob, {
        x: viewportCenterX - (blobWidth / 2),
        y: viewportCenterY - (blobHeight / 2),
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
        force3D: true
      });
    }
  };

  // Señal para el skill seleccionado
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

  // Helper para obtener la skill correcta según el modo (desktop/mobile)
  private getSkill(bubble: Bubble, isMobile: boolean): SkillData | undefined {
    return isMobile ? bubble.skill_mobile : bubble.skill_desktop;
  }

  // Helper público para usar en el template - usa el ancho actual de la ventana
  hasSkill(bubble: Bubble): boolean {
    const isMobile = this.config.isMobile();
    return !!this.getSkill(bubble, isMobile);
  }

  // Helper público para obtener el skill en el template
  getSkillForBubble(bubble: Bubble): SkillData | undefined {
    const isMobile = this.config.isMobile();
    return this.getSkill(bubble, isMobile);
  }

  // Helper para obtener la altura total del scroll
  get SKILLS_SCROLL_HEIGHT(): number {
    const isMobile = this.config.isMobile();
    // Suma de todas las duraciones de las fases
    // Phase 1: isMobile ? 500 : 700
    // Phase 2: 200
    // Phase 3: isMobile ? 800 : 1000
    // Phase 4: isMobile ? 800 : 1000
    // Phase 5: SEQUENCE_DURATION (1250)
    
    const phase1 = isMobile ? 500 : 700;
    const phase2 = 200;
    const phase3 = isMobile ? 800 : 1000;
    const phase4 = isMobile ? 800 : 1000;
    const phase5 = this.config.SEQUENCE_DURATION;
    
    // Margen de seguridad al final
    return phase1 + phase2 + phase3 + phase4 + phase5 + 100;
  }

  bubbles: Bubble[] = BUBBLES as Bubble[];

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    // Esperar a que el blob tenga dimensiones establecidas antes de calcular posiciones
    const waitForBlobDimensions = () => {
      // Intentar calcular, si falla (dimensiones no disponibles), reintentar
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

    // Ejecutar inmediatamente
    waitForBlobDimensions();

    // También ejecutar después de un pequeño delay para asegurar que las dimensiones estén disponibles
    requestAnimationFrame(() => waitForBlobDimensions());
    setTimeout(() => waitForBlobDimensions(), 100);
    setTimeout(() => waitForBlobDimensions(), 500); // Extra check for mobile

    // Ensure reverse blob is positioned correctly once loaded
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
    // Debounce para evitar cálculos excesivos durante el resize
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    
    this.resizeTimeout = setTimeout(() => {
      // Recalcular posiciones de bubbles con las nuevas dimensiones del viewport
      this.calculateBubblePositions();

      // Recrear todas las animaciones con las nuevas dimensiones
      this.setupBubblesAnimation();
      this.setupPhase1Animation();
      this.setupPhase2Animation();
      this.setupPhase3Animation();
      this.setupPhase4Animation();
      this.setupPhase5Animation();
      this.clearInteractionListeners();
      this.setupBubbleInteractions();

      // Refresh de ScrollTrigger para recalcular posiciones
      ScrollTrigger.refresh();
      this.updateReverseBlobPositionBound();
    }, 250); // Increased debounce for mobile stability
  }

  private getNavbarHeight(): number {
    return this.config.getNavbarHeight();
  }

  private getAdjustedCenterY(): number {
    return this.config.getAdjustedCenterY();
  }

  private calculateBubblePositions(): void {
    // Asegurar que tenemos dimensiones iniciales válidas en el servicio
    // Si no están seteadas (ej: refresh directo en skills), el servicio las calculará determinísticamente
    if (!(this.config as any)['initialBlobDimensions']) {
      // Intentar obtener del DOM por si acaso está disponible
      const aboutBlob = document.querySelector('[alt="3D blob"]') as HTMLImageElement;
      if (aboutBlob && aboutBlob.offsetWidth > 0 && aboutBlob.offsetHeight > 0) {
        this.config.setInitialBlobDimensions(aboutBlob.offsetWidth, aboutBlob.offsetHeight);
      } else {
        // Si no, forzar cálculo determinístico
        this.config.calculateExpectedBlobDimensions();
      }
    }

    // Obtener las dimensiones finales del blob en About
    const isMobile = this.config.isMobile();
    const finalBlobWidth = this.config.getFinalBlobWidth(isMobile);

    // Calcular el factor de escala basado en el ancho final del blob vs el original
    let scale = this.config.getBlobScale(isMobile);
    
    // Validar que scale sea válido
    if (scale <= 0 || !isFinite(scale)) {
      console.warn('Invalid scale calculated:', scale, 'Using fallback 1.0');
      scale = 1.0;
    }

    // Ensure reverse blob matches these dimensions if it exists
    if (this.reverseBlobRef?.nativeElement) {
      const reverseBlob = this.reverseBlobRef.nativeElement;
      
      // Pre-calculate position to avoid jump on first scroll
      const expected = this.config.calculateExpectedBlobDimensions();
      const blobWidth = reverseBlob.offsetWidth || expected.width;
      const blobHeight = reverseBlob.offsetHeight || expected.height;
      
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = this.config.getAdjustedCenterY();
      
      gsap.set(reverseBlob, {
        x: viewportCenterX - (blobWidth / 2),
        y: viewportCenterY - (blobHeight / 2),
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
        force3D: true
      });
    }

    // Calcular el centro donde debe estar el blob
    const centerX = window.innerWidth / 2;
    const centerY = this.getAdjustedCenterY();

    // La altura escalada del blob original
    const finalBlobHeight = this.config.ORIGINAL_BLOB_HEIGHT * scale;

    // Punto superior izquierdo del blob escalado y centrado
    const blobStartX = centerX - finalBlobWidth / 2;
    const blobStartY = centerY - finalBlobHeight / 2;

    // Centro del blob (punto de rotación)
    const blobCenterX = centerX;
    const blobCenterY = centerY;

    // Calcular posición y tamaño de cada burbuja
    this.bubbles.forEach((bubble) => {
      // Escalar dimensiones manteniendo aspect ratio
      // Asegurar mínimo 1px para evitar problemas de renderizado
      bubble.width = Math.max(bubble.originalWidth * scale, 1);
      bubble.height = Math.max(bubble.originalHeight * scale, 1);

      // Escalar posiciones relativas
      let scaledX = bubble.originalX * scale;
      let scaledY = bubble.originalY * scale;

      // En mobile, rotar las coordenadas 90 grados alrededor del centro del blob
      if (isMobile) {
        // Posición relativa al centro del blob ANTES de escalar
        const relativeX =
          bubble.originalX + bubble.originalWidth / 2 - this.config.ORIGINAL_BLOB_WIDTH / 2;
        const relativeY =
          bubble.originalY + bubble.originalHeight / 2 - this.config.ORIGINAL_BLOB_HEIGHT / 2;

        // Rotar 90 grados: (x, y) -> (-y, x)
        const rotatedRelativeX = -relativeY;
        const rotatedRelativeY = relativeX;

        // Escalar después de rotar
        const scaledRotatedX = rotatedRelativeX * scale;
        const scaledRotatedY = rotatedRelativeY * scale;

        // Convertir de vuelta a coordenadas absolutas centradas
        scaledX = scaledRotatedX - bubble.width / 2;
        scaledY = scaledRotatedY - bubble.height / 2;

        // Calcular posición absoluta en pantalla
        bubble.x = blobCenterX + scaledX;
        bubble.y = blobCenterY + scaledY;
      } else {
        // Desktop: usar coordenadas normales
        bubble.x = blobStartX + scaledX;
        bubble.y = blobStartY + scaledY;
      }
    });
  }

  // FASE 1: Skills sube desde bottom hasta navbar bottom + 10px
  // Mientras tanto: icons aparecen, bubbles+icons se centran verticalmente
  // Bubbles sin iconos también bajan pero más rápido hasta desaparecer
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
        // 1. Título sube desde bottom hasta navbar bottom + 10px
        const startY = window.innerHeight / 2;
        const currentTitleY = startY - (self.progress * (startY - layout.titleFinalY));

        gsap.set(title, {
          y: currentTitleY,
          opacity: Math.min(1, self.progress * 2),
        });

        // 2. Bubbles+icons: centrarlos verticalmente y hacer aparecer icons
        // 3. Bubbles sin icons: bajar más rápido hasta desaparecer fuera de pantalla
        if (this.bubbleContainers && this.bubbleIcons) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              // Obtener el índice del skill (0-7 para los 8 skills)
              const skillIndex = this.bubbles.slice(0, index + 1).filter(b => this.getSkill(b, isMobile)).length - 1;

              // Tanto mobile como desktop: centrar el grupo manteniendo distribución relativa orgánica
              const allSkillBubbles = this.bubbles.filter(b => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map(b => b.y));
              const maxY = Math.max(...allSkillBubbles.map(b => b.y + b.height));
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

              // Hacer aparecer el icono progresivamente
              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                const delay = skillIndex * 0.08;
                const iconProgress = Math.max(0, Math.min(1, (self.progress - delay) / (1 - delay)));
                gsap.set(iconRef.nativeElement, {
                  opacity: iconProgress,
                });
              }
            } else {
              // Bubbles sin skill: bajar más rápido hasta desaparecer
              // Velocidad 1.5x más rápida que las bubbles con skill
              const targetY = bubble.y + (window.innerHeight * 1.5);
              const moveY = (targetY - bubble.y) * self.progress;

              gsap.set(container, {
                x: bubble.x,
                y: bubble.y + moveY,
                autoAlpha: Math.max(0, 1 - self.progress * 1.2), // Desaparecer más rápido también
              });
            }
          });
        }
      },
    });
  }

  // FASE 2: Todo se mantiene quieto (punto de anclaje para navbar)
  // Bubbles sin icon desaparecen instantáneamente
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
      end: `+=200`, // 200px de scroll donde todo está quieto
      scrub: true,
      markers: false,
      id: 'skills-anchor',
      invalidateOnRefresh: true,
      onUpdate: () => {
        // Mantener título en su posición
        gsap.set(title, {
          y: layout.titleFinalY,
          opacity: 1,
        });

        // Mantener bubbles+icons en su posición centrada
        // Desaparecer bubbles sin icon instantáneamente
        if (this.bubbleContainers && this.bubbleIcons) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex = this.bubbles.slice(0, index + 1).filter(b => this.getSkill(b, isMobile)).length - 1;

              // Tanto mobile como desktop: usar distribución orgánica relativa
              const allSkillBubbles = this.bubbles.filter(b => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map(b => b.y));
              const maxY = Math.max(...allSkillBubbles.map(b => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const targetY = bubble.y + groupOffset;

              gsap.set(container, {
                x: bubble.x,
                y: targetY,
                autoAlpha: 1,
              });

              // Icons completamente visibles
              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, { opacity: 1 });
              }
            } else {
              // Bubbles sin icon: desaparecen instantáneamente
              gsap.set(container, {
                autoAlpha: 0,
              });
            }
          });
        }
      },
    });
  }

  // FASE 3: Skills desaparece, bubbles+icons se distribuyen
  // Desktop: bubbles+icons a la derecha, texto a la izquierda
  // Mobile: texto arriba, bubbles+icons en mitad inferior
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

    // Using DESKTOP_POSITIONS constant imported from ./constants

    this.phase3ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 700 : 900}`,
      end: `+=${isMobile ? 800 : 1000}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // 1. Skills sube hacia arriba (sin fade, solo movimiento)
        // Aumentar el offset para asegurar que el título desaparezca completamente
        const titleDisappearY = layout.titleFinalY - (layout.titleHeight + 100);
        const currentTitleY = layout.titleFinalY - (self.progress * Math.abs(layout.titleFinalY - titleDisappearY));

        gsap.set(title, {
          y: currentTitleY,
          opacity: 1, // Mantener visible, solo sube
        });

        // 2. Bubbles+icons se distribuyen
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex = this.bubbles.slice(0, index + 1).filter(b => this.getSkill(b, isMobile)).length - 1;

              // Calcular startY de la Fase 2 (distribución orgánica)
              const allSkillBubbles = this.bubbles.filter(b => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map(b => b.y));
              const maxY = Math.max(...allSkillBubbles.map(b => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const startY = bubble.y + groupOffset;

              // Use MOBILE_POSITIONS constant imported from ./constants

              if (isMobile) {
                // Mobile: distribuir en posiciones orgánicas ocupando la MITAD INFERIOR
                const mobilePos = MOBILE_POSITIONS[skillIndex];
                const margin = 20;

                // La mitad inferior comienza a la mitad de la pantalla
                const lowerHalfStart = layout.navbarHeight + (availableHeight / 2);
                const lowerHalfHeight = availableHeight / 2;

                const finalX = margin + mobilePos.x * (availableWidth - margin * 2 - bubble.width);
                const finalY = lowerHalfStart + margin + mobilePos.y * (lowerHalfHeight - margin * 2 - bubble.height);

                const moveX = (finalX - bubble.x) * self.progress;
                const moveY = (finalY - startY) * self.progress;

                gsap.set(container, {
                  x: bubble.x + moveX,
                  y: startY + moveY,
                  autoAlpha: 1,
                });
              } else {
                // Desktop: mover a la derecha en posiciones orgánicas
                const desktopPos = DESKTOP_POSITIONS[skillIndex];
                const rightHalfStart = availableWidth / 2;
                const rightHalfWidth = availableWidth / 2;
                const margin = 60;

                const finalX = rightHalfStart + margin + desktopPos.x * (rightHalfWidth - margin * 2);
                const finalY = layout.navbarHeight + margin + desktopPos.y * (availableHeight - margin * 2);

                const moveX = (finalX - bubble.x) * self.progress;
                const moveY = (finalY - startY) * self.progress;

                gsap.set(container, {
                  x: bubble.x + moveX,
                  y: startY + moveY,
                  autoAlpha: 1,
                });
              }

              // Mantener rotación de la bubble
              const img = this.bubbleImgs.toArray()[index]?.nativeElement;
              if (img) {
                gsap.set(img, {
                  rotation: this.config.getFinalRotation(isMobile),
                });
              }

              // En mobile los iconos NO se rotan (0 grados)
              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, {
                  rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
                });
              }
            }
          });
        }

        // 3. Mostrar texto cuando bubbles+icons llegan a su posición final
        if (skillInfo) {
          const textProgress = Math.max(0, (self.progress - 0.6) / 0.4);
          gsap.set(skillInfo, {
            opacity: textProgress,
          });
        }
      },
      onRefresh: (self) => {
        // Forzar actualización del texto al refrescar
        if (skillInfo) {
          const textProgress = Math.max(0, (self.progress - 0.6) / 0.4);
          gsap.set(skillInfo, {
            opacity: textProgress,
          });
        }
      }
    });
  }

  // FASE 4: Bubbles regresan al centro (cluster) y se ocultan iconos/texto
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
        // 1. Ocultar texto (skillInfo) rápidamente al inicio
        if (skillInfo) {
          gsap.set(skillInfo, { opacity: Math.max(0, 1 - self.progress * 4) });
        }

        // 2. Bubbles regresan a su posición original (cluster)
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef, index) => {
            const container = containerRef.nativeElement;
            const bubble = this.bubbles[index];
            const skill = this.getSkill(bubble, isMobile);

            if (skill) {
              const skillIndex = this.bubbles.slice(0, index + 1).filter(b => this.getSkill(b, isMobile)).length - 1;

              // Recalcular posición final de Fase 3 (donde empieza Fase 4)
              // Esto es necesario porque scrub interpola desde el estado actual
              // Pero necesitamos saber desde dónde venimos exactamente
              
              // ...existing logic from Phase 3 to calculate start positions...
              // Simplificación: Phase 3 deja las bubbles en su posición distribuida.
              // Phase 4 las lleva de vuelta a bubble.x / bubble.y
              
              // Calcular posición distribuida (Phase 3 end state)
              let startX = bubble.x;
              let startY = bubble.y; // Fallback

              // Calcular startY de la Fase 2 (distribución orgánica)
              const allSkillBubbles = this.bubbles.filter(b => this.getSkill(b, isMobile));
              const minY = Math.min(...allSkillBubbles.map(b => b.y));
              const maxY = Math.max(...allSkillBubbles.map(b => b.y + b.height));
              const currentCenterY = (minY + maxY) / 2;
              const targetCenterY = layout.bubblesTopY + layout.bubblesAreaHeight / 2;
              const groupOffset = targetCenterY - currentCenterY;
              const phase2Y = bubble.y + groupOffset;

              if (isMobile) {
                const mobilePos = MOBILE_POSITIONS[skillIndex];
                const margin = 20;
                const lowerHalfStart = layout.navbarHeight + (availableHeight / 2);
                const lowerHalfHeight = availableHeight / 2;
                startX = margin + mobilePos.x * (availableWidth - margin * 2 - bubble.width);
                startY = lowerHalfStart + margin + mobilePos.y * (lowerHalfHeight - margin * 2 - bubble.height);
              } else {
                const desktopPos = DESKTOP_POSITIONS[skillIndex];
                const rightHalfStart = availableWidth / 2;
                const rightHalfWidth = availableWidth / 2;
                const margin = 60;
                startX = rightHalfStart + margin + desktopPos.x * (rightHalfWidth - margin * 2);
                startY = layout.navbarHeight + margin + desktopPos.y * (availableHeight - margin * 2);
              }

              // Interpolar desde posición distribuida (startX, startY) a posición original (bubble.x, bubble.y)
              const currentX = startX + (bubble.x - startX) * self.progress;
              const currentY = startY + (bubble.y - startY) * self.progress;

              gsap.set(container, {
                x: currentX,
                y: currentY,
                autoAlpha: 1,
              });

              // Ocultar iconos progresivamente
              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, {
                  opacity: Math.max(0, 1 - self.progress * 2), // Desaparecen rápido
                  rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
                });
              }
            } else {
              // Bubbles sin skill (que desaparecieron en Fase 1/2)
              // Deben regresar desde abajo hacia su posición original
              
              // Posición inicial (donde terminaron en Fase 1/2)
              const startY = bubble.y + (window.innerHeight * 1.5);
              
              // Interpolar hacia bubble.y
              const currentY = startY + (bubble.y - startY) * self.progress;
              
              gsap.set(container, {
                x: bubble.x,
                y: currentY,
                autoAlpha: self.progress, // Aparecen progresivamente
              });
            }
          });
        }
      }
    });
  }

  // FASE 5: Bubbles desaparecen, aparece Blob y secuencia inversa 25 -> 01
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

    // Reducir la duración del scroll para que no se sienta tan largo
    // Antes: 800/1000 -> Ahora: SEQUENCE_DURATION (match About speed)
    const phase5Duration = this.config.SEQUENCE_DURATION;
    
    this.phase5ScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: `top center-=${isMobile ? 2300 : 2900}`,
      end: `+=${phase5Duration}`,
      scrub: true,
      markers: false,
      invalidateOnRefresh: true,
      onLeave: () => {
        // Al terminar la fase (scrolleando hacia abajo), ocultar blob inmediato y notificar a Projects
        gsap.set(reverseBlob, { opacity: 0 });
        this.emitSkillsBlobFinished(getBlobPayload());
      },
      onLeaveBack: () => {
        // Al regresar a Fase 4, ocultar blob y mostrar bubbles
        gsap.set(reverseBlob, { opacity: 0 });
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 1 });
          });
        }
        this.emitSkillsBlobReset();
      },
      onUpdate: (self) => {
        // 1. Bubbles desaparecen inmediatamente y Blob aparece inmediatamente
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 0 });
          });
        }
        
        // Calcular posición centrada igual que en About
        const expected = this.config.calculateExpectedBlobDimensions();
        const blobWidth = reverseBlob.offsetWidth || expected.width;
        const blobHeight = reverseBlob.offsetHeight || expected.height;
        
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = this.config.getAdjustedCenterY();
        
        gsap.set(reverseBlob, { 
          opacity: 1,
          scale: this.config.BLOB_SCALE,
          rotation: this.config.getFinalRotation(isMobile),
          x: viewportCenterX - (blobWidth / 2),
          y: viewportCenterY - (blobHeight / 2),
          force3D: true,
        });

        // 2. Secuencia de imágenes inversa: 25 -> 01
        const imageIndex = Math.floor((1 - self.progress) * totalImages) + 1;
        const clampedIndex = Math.min(Math.max(imageIndex, 1), totalImages);
        const imageNumber = String(clampedIndex).padStart(2, '0');
        
        reverseBlob.src = `assets/3d_shape/${imageNumber}.webp`;
      }
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

    // Posicionar inicialmente todas las burbujas y sus iconos
    const isMobile = this.config.isMobile();

    // Posicionar los contenedores de las bubbles PRIMERO (esto posiciona todo el conjunto)
    if (this.bubbleContainers) {
      this.bubbleContainers.forEach((containerRef, index) => {
        const bubble = this.bubbles[index];
        const container = containerRef.nativeElement;

        gsap.set(container, {
          x: bubble.x,
          y: bubble.y,
          width: bubble.width,
          height: bubble.height,
          autoAlpha: 0, // Inicialmente oculto y sin pointer-events
          force3D: true,
        });
      });
    }

    // Las imágenes de las bubbles ocupan el 100% del contenedor
    this.bubbleImgs.forEach((ref, index) => {
      const img = ref.nativeElement;

      gsap.set(img, {
        rotation: this.config.getFinalRotation(isMobile),
        opacity: 0,
        force3D: true,
      });
    });

    // Los iconos se posicionan con left:50%, top:50%, transform:translate(-50%,-50%) en el HTML
    // Aplicamos ajustes finos de posición y escala
    if (this.bubbleIcons) {
      let iconIndex = 0;
      this.bubbles.forEach((bubble, bubbleIndex) => {
        const skill = this.getSkill(bubble, isMobile);
        if (skill) {
          const iconRef = this.bubbleIcons.toArray()[iconIndex];
          if (!iconRef) return;

          const icon = iconRef.nativeElement;
          const baseIconSize = bubble.width * 0.4; // 40% del tamaño de la bubble
          const iconScale = skill.iconScale || 1;
          const iconSize = baseIconSize * iconScale;

          // iconInitialX/Y funcionan igual que originalX/originalY de las bubbles:
          // Se definen una vez en píxeles (en la imagen de referencia 1536x1024)
          // y se escalan proporcionalmente usando el mismo factor de escala
          const scale = this.config.getBlobScale(isMobile);
          const initialX = (skill.iconInitialX || 0) * scale;
          const initialY = (skill.iconInitialY || 0) * scale;

          gsap.set(icon, {
            width: iconSize,
            height: iconSize,
            // IMPORTANTE: En mobile los iconos NO se rotan (0 grados) mientras las bubbles están rotadas 90°
            rotation: isMobile ? 0 : this.config.getFinalRotation(isMobile),
            opacity: 0,
            // Ajustar la posición del icono dentro de la bubble
            left: `calc(50% + ${initialX}px)`,
            top: `calc(50% + ${initialY}px)`,
            force3D: true,
          });

          iconIndex++;
        }
      });
    }

    // ScrollTrigger para mostrar las burbujas Y el título cuando comienza la sección
    this.bubblesScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'top center',
      markers: false,
      invalidateOnRefresh: true,
      onEnter: () => {
        // Mostrar el título instantáneamente
        gsap.set(title, { opacity: 1 });

        // Mostrar las burbujas instantáneamente
        this.bubbleImgs.forEach((ref) => {
          gsap.set(ref.nativeElement, { opacity: 1 });
        });
        
        // Asegurar que los contenedores sean visibles
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 1 });
          });
        }
      },
      onLeaveBack: () => {
        // Ocultar el título
        gsap.set(title, { opacity: 0 });

        // Ocultar las burbujas
        this.bubbleImgs.forEach((ref) => {
          gsap.set(ref.nativeElement, { opacity: 0 });
        });
        
        // Ocultar los contenedores para evitar clicks fantasma
        if (this.bubbleContainers) {
          this.bubbleContainers.forEach((containerRef) => {
            gsap.set(containerRef.nativeElement, { autoAlpha: 0 });
          });
        }

        // Ocultar iconos
        if (this.bubbleIcons) {
          this.bubbleIcons.forEach((iconRef) => {
            gsap.set(iconRef.nativeElement, { opacity: 0 });
          });
        }
      },
    });

    // Estado inicial determinístico según scroll actual
    const sectionTop = section.getBoundingClientRect().top;
    const centerY = window.innerHeight / 2;
    // Si estamos más abajo del punto de inicio (top <= center), deben ser visibles
    const isPastStart = sectionTop <= centerY;
    
    gsap.set(title, { opacity: isPastStart ? 1 : 0 });
    this.bubbleImgs.forEach((ref) => {
      gsap.set(ref.nativeElement, { opacity: isPastStart ? 1 : 0 });
    });
    
    // Sincronizar visibilidad de contenedores
    if (this.bubbleContainers) {
      this.bubbleContainers.forEach((containerRef) => {
        gsap.set(containerRef.nativeElement, { autoAlpha: isPastStart ? 1 : 0 });
      });
    }
    
    // Los iconos se manejan en Phase 1/2, así que inicialmente ocultos si no estamos en esas fases
    // Pero si estamos en Phase 2/3, deberían ser visibles.
    // Dejamos que Phase 1/2/3 manejen la opacidad de los iconos, aquí solo inicializamos a 0 si no estamos visibles
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

      // Solo agregar interacción a bubbles con skill
      if (skill) {
        // El contenedor ya tiene pointer-events auto en el HTML para bubbles con skill

        // Obtener la imagen y el icono de esta bubble
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

        // Animación de hover moderna - solo escala suave
        const hoverTimeline = gsap.timeline({ paused: true });

        // Animar tanto la bubble como el icono
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

        // Click para cambiar el skill seleccionado
        const onClick = () => {
          this.selectedSkill.set(skill);

          // Animación de "pulso" suave al hacer click
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

  // Método para obtener la posición de scroll del punto de anclaje (fase 2)
  // El navbar usará esto para scrollear a la posición correcta
  getAnchorScrollPosition(): number {
    const section = this.sectionRef?.nativeElement;
    if (!section) return 0;

    const isMobile = window.innerWidth < 640;
    const sectionTop = section.offsetTop;
    const viewportCenter = window.innerHeight / 2;

    // La posición de inicio de la fase 2 (donde todo está quieto y bien posicionado)
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
        try { fn(); } catch {}
      });
      this.interactionCleanups = [];
    }
  }
}
