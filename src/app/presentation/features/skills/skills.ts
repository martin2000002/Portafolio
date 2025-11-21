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
  @ViewChildren('bubbleImg') bubbleImgs!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChildren('bubbleIcon') bubbleIcons!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChildren('bubbleContainer') bubbleContainers!: QueryList<ElementRef<HTMLDivElement>>;

  private titleScrollTrigger?: ScrollTrigger;
  private bubblesScrollTrigger?: ScrollTrigger;
  private phase1ScrollTrigger?: ScrollTrigger; // Fase 1: Skills sube, icons aparecen, bubbles se centran
  private phase2ScrollTrigger?: ScrollTrigger; // Fase 2: Todo quieto (punto de anclaje)
  private phase3ScrollTrigger?: ScrollTrigger; // Fase 3: Skills desaparece, bubbles se distribuyen
  private skillInfoScrollTrigger?: ScrollTrigger;
  private interactionCleanups: Array<() => void> = [];

  // Señal para el skill seleccionado
  selectedSkill = signal<SkillData>({
    name: 'Angular',
    description:
      'Construcción de aplicaciones web dinámicas con componentes reutilizables. Implementación de servicios, routing y binding de datos eficiente.',
    icon: 'assets/skills/icons/angular.webp',
  });

  constructor(private readonly config: BlobAnimationConfigService) {}

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

  bubbles: Bubble[] = [
    // Fila 1 (0°) - Top row en desktop | Cuando rota 90° estas se vuelven la columna de arriba
    {
      id: '1_1',
      src: 'assets/skills/bubbles/1_1.webp',
      originalWidth: 210,
      originalHeight: 194,
      originalX: 218,
      originalY: 198,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'Angular',
        description:
          'Construcción de aplicaciones web dinámicas con componentes reutilizables. Implementación de servicios, routing y binding de datos eficiente.',
        icon: 'assets/skills/icons/angular.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
      skill_mobile: {
        name: 'Three.js',
        description:
          'Creación de experiencias 3D interactivas en el navegador. Animaciones, iluminación y renderizado de escenas tridimensionales.',
        icon: 'assets/skills/icons/threejs.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '1_2',
      src: 'assets/skills/bubbles/1_2.webp',
      originalWidth: 187,
      originalHeight: 210,
      originalX: 550,
      originalY: 190,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'React',
        description:
          'Desarrollo de interfaces de usuario interactivas con componentes funcionales. Gestión de estado con hooks y optimización del rendimiento.',
        icon: 'assets/skills/icons/react.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.25,
      },
      skill_mobile: {
        name: 'Firebase',
        description:
          'Plataforma de desarrollo de aplicaciones móviles y web. Autenticación, base de datos en tiempo real y hosting en la nube.',
        icon: 'assets/skills/icons/firebase.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '1_3',
      src: 'assets/skills/bubbles/1_3.webp',
      originalWidth: 203,
      originalHeight: 151,
      originalX: 860,
      originalY: 187,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'Three.js',
        description:
          'Creación de experiencias 3D interactivas en el navegador. Animaciones, iluminación y renderizado de escenas tridimensionales.',
        icon: 'assets/skills/icons/threejs.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      }
    },
    {
      id: '1_4',
      src: 'assets/skills/bubbles/1_4.webp',
      originalWidth: 205,
      originalHeight: 205,
      originalX: 1135,
      originalY: 187,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: '.NET',
        description:
          'Desarrollo de aplicaciones empresariales robustas. APIs RESTful, arquitectura en capas y Entity Framework para gestión de datos.',
        icon: 'assets/skills/icons/dotnet.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
      // Sin skill en mobile
    },
    // Fila 2 (0°) - Middle row en desktop | Cuando rota 90° estas se vuelven la columna del medio
    {
      id: '2_1',
      src: 'assets/skills/bubbles/2_1.webp',
      originalWidth: 171,
      originalHeight: 125,
      originalX: 170,
      originalY: 447,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'Docker',
        description:
          'Containerización de aplicaciones para entornos consistentes. Orquestación de servicios con Docker Compose y despliegue en producción.',
        icon: 'assets/skills/icons/docker.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
      skill_mobile: {
        name: 'React',
        description:
          'Desarrollo de interfaces de usuario interactivas con componentes funcionales. Gestión de estado con hooks y optimización del rendimiento.',
        icon: 'assets/skills/icons/react.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.25,
      },
    },
    {
      id: '2_2',
      src: 'assets/skills/bubbles/2_2.webp',
      originalWidth: 158,
      originalHeight: 196,
      originalX: 547,
      originalY: 440,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'Firebase',
        description:
          'Plataforma de desarrollo de aplicaciones móviles y web. Autenticación, base de datos en tiempo real y hosting en la nube.',
        icon: 'assets/skills/icons/firebase.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
      skill_mobile: {
        name: 'Docker',
        description:
          'Containerización de aplicaciones para entornos consistentes. Orquestación de servicios con Docker Compose y despliegue en producción.',
        icon: 'assets/skills/icons/docker.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '2_3',
      src: 'assets/skills/bubbles/2_3.webp',
      originalWidth: 154,
      originalHeight: 216,
      originalX: 870,
      originalY: 400,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'SQL Server',
        description:
          'Diseño y administración de bases de datos relacionales. Optimización de consultas, stored procedures y manejo de transacciones.',
        icon: 'assets/skills/icons/sqlserver.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.4,
      },
      skill_mobile: {
        name: 'Git',
        description:
          'Control de versiones y colaboración en proyectos de software. Manejo de ramas, merges y resolución de conflictos en equipos.',
        icon: 'assets/skills/icons/git.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '2_4',
      src: 'assets/skills/bubbles/2_4.webp',
      originalWidth: 153,
      originalHeight: 122,
      originalX: 1202,
      originalY: 447,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      skill_desktop: {
        name: 'Git',
        description:
          'Control de versiones y colaboración en proyectos de software. Manejo de ramas, merges y resolución de conflictos en equipos.',
        icon: 'assets/skills/icons/git.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
      // Sin skill en mobile (queda vacía)
    },

    // Fila 3 (0°) - Bottom row en desktop | Cuando rota 90° estas se vuelven la columna de abajo
    {
      id: '3_1',
      src: 'assets/skills/bubbles/3_1.webp',
      originalWidth: 172,
      originalHeight: 202,
      originalX: 206,
      originalY: 640,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      // Sin skill en desktop
      skill_mobile: {
        name: 'Angular',
        description:
          'Construcción de aplicaciones web dinámicas con componentes reutilizables. Implementación de servicios, routing y binding de datos eficiente.',
        icon: 'assets/skills/icons/angular.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '3_2',
      src: 'assets/skills/bubbles/3_2.webp',
      originalWidth: 167,
      originalHeight: 148,
      originalX: 424,
      originalY: 672,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      // Sin skill en desktop
      skill_mobile: {
        name: '.NET',
        description:
          'Desarrollo de aplicaciones empresariales con C#. APIs REST, Entity Framework y arquitecturas limpias para aplicaciones escalables.',
        icon: 'assets/skills/icons/dotnet.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.3,
      },
    },
    {
      id: '3_3',
      src: 'assets/skills/bubbles/3_3.webp',
      originalWidth: 208,
      originalHeight: 201,
      originalX: 690,
      originalY: 650,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      // Sin skill en desktop
      skill_mobile: {
        name: 'SQL Server',
        description:
          'Diseño y administración de bases de datos relacionales. Optimización de consultas, stored procedures y manejo de transacciones.',
        icon: 'assets/skills/icons/sqlserver.webp',
        iconInitialX: 0,
        iconInitialY: 0,
        iconScale: 1.4,
      },
    },
    {
      id: '3_4',
      src: 'assets/skills/bubbles/3_4.webp',
      originalWidth: 187,
      originalHeight: 157,
      originalX: 948,
      originalY: 668,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      // Sin skill en desktop ni mobile
    },
    {
      id: '3_5',
      src: 'assets/skills/bubbles/3_5.webp',
      originalWidth: 170,
      originalHeight: 210,
      originalX: 1195,
      originalY: 637,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      // Sin skill en desktop ni mobile
    },
  ];

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
      this.clearInteractionListeners();
      this.setupBubbleInteractions();
    };

    // Ejecutar inmediatamente
    waitForBlobDimensions();

    // También ejecutar después de un pequeño delay para asegurar que las dimensiones estén disponibles
    requestAnimationFrame(() => waitForBlobDimensions());
    setTimeout(() => waitForBlobDimensions(), 100);
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
      this.clearInteractionListeners();
      this.setupBubbleInteractions();

      // Refresh de ScrollTrigger para recalcular posiciones
      ScrollTrigger.refresh();
    }, 100);
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
                opacity: 1,
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
                opacity: Math.max(0, 1 - self.progress * 1.2), // Desaparecer más rápido también
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
                opacity: 1,
              });

              // Icons completamente visibles
              const iconRef = this.bubbleIcons.toArray()[skillIndex];
              if (iconRef) {
                gsap.set(iconRef.nativeElement, { opacity: 1 });
              }
            } else {
              // Bubbles sin icon: desaparecen instantáneamente
              gsap.set(container, {
                opacity: 0,
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

    const desktopPositions = [
      { x: 0.18, y: 0.20 }, { x: 0.42, y: 0.08 }, { x: 0.82, y: 0.18 }, { x: 0.75, y: 0.40 },
      { x: 0.25, y: 0.45 }, { x: 0.88, y: 0.74 }, { x: 0.48, y: 0.62 }, { x: 0.18, y: 0.75 },
    ];

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

              // Posiciones orgánicas para mobile (8 skills)
              const mobilePositions = [
                { x: 0.15, y: 0.12 }, // Three.js
                { x: 0.68, y: 0.08 }, // Firebase
                { x: 0.42, y: 0.28 }, // SQL Server
                { x: 0.80, y: 0.35 }, // Git
                { x: 0.22, y: 0.52 }, // React
                { x: 0.55, y: 0.58 }, // Docker
                { x: 0.10, y: 0.78 }, // Angular
                { x: 0.72, y: 0.75 }, // .NET
              ];

              if (isMobile) {
                // Mobile: distribuir en posiciones orgánicas ocupando la MITAD INFERIOR
                const mobilePos = mobilePositions[skillIndex];
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
                  opacity: 1,
                });
              } else {
                // Desktop: mover a la derecha en posiciones orgánicas
                const desktopPos = desktopPositions[skillIndex];
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
                  opacity: 1,
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
      },
      onLeaveBack: () => {
        // Ocultar el título
        gsap.set(title, { opacity: 0 });

        // Ocultar las burbujas
        this.bubbleImgs.forEach((ref) => {
          gsap.set(ref.nativeElement, { opacity: 0 });
        });

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
