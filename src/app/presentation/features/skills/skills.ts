import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  // Offsets ajustables en píxeles (para tweaking fino)
  offsetX?: number;
  offsetY?: number;
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
    class: 'block'
  }
})
export class Skills implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef', { static: false }) sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('titleRef', { static: false }) titleRef!: ElementRef<HTMLElement>;
  @ViewChildren('bubbleImg') bubbleImgs!: QueryList<ElementRef<HTMLImageElement>>;

  private titleScrollTrigger?: ScrollTrigger;
  private bubblesScrollTrigger?: ScrollTrigger;

  // Configuración de burbujas basada en imagen original de 1536x1024
  // Para ajustar posiciones, usa offsetX y offsetY
  private readonly ORIGINAL_BLOB_WIDTH = 1536;
  private readonly ORIGINAL_BLOB_HEIGHT = 1024;

  bubbles: Bubble[] = [
    // Fila 1
    {
      id: '1_1', src: 'assets/skills/1_1.webp',
      originalWidth: 210, originalHeight: 194,
      originalX: 218, originalY: 198,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '1_2', src: 'assets/skills/1_2.webp',
      originalWidth: 187, originalHeight: 210,
      originalX: 550, originalY: 190,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '1_3', src: 'assets/skills/1_3.webp',
      originalWidth: 203, originalHeight: 151,
      originalX: 860, originalY: 187,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '1_4', src: 'assets/skills/1_4.webp',
      originalWidth: 205, originalHeight: 205,
      originalX: 1135, originalY: 187,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },

    // Fila 2
    {
      id: '2_1', src: 'assets/skills/2_1.webp',
      originalWidth: 171, originalHeight: 125,
      originalX: 170, originalY: 447,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '2_2', src: 'assets/skills/2_2.webp',
      originalWidth: 158, originalHeight: 196,
      originalX: 547, originalY: 440,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '2_3', src: 'assets/skills/2_3.webp',
      originalWidth: 154, originalHeight: 216,
      originalX: 870, originalY: 400,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '2_4', src: 'assets/skills/2_4.webp',
      originalWidth: 153, originalHeight: 122,
      originalX: 1202, originalY: 447,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },

    // Fila 3
    {
      id: '3_1', src: 'assets/skills/3_1.webp',
      originalWidth: 172, originalHeight: 202,
      originalX: 206, originalY: 640,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '3_2', src: 'assets/skills/3_2.webp',
      originalWidth: 167, originalHeight: 148,
      originalX: 424, originalY: 672,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '3_3', src: 'assets/skills/3_3.webp',
      originalWidth: 208, originalHeight: 201,
      originalX: 690, originalY: 650,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '3_4', src: 'assets/skills/3_4.webp',
      originalWidth: 187, originalHeight: 157,
      originalX: 948, originalY: 668,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
    {
      id: '3_5', src: 'assets/skills/3_5.webp',
      originalWidth: 170, originalHeight: 210,
      originalX: 1195, originalY: 637,
      offsetX: 0, offsetY: 0,
      width: 0, height: 0, x: 0, y: 0
    },
  ];

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.calculateBubblePositions();
    this.setupTitleAnimation();
    this.setupBubblesAnimation();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateBubblePositions();
    this.setupTitleAnimation();
    this.setupBubblesAnimation();
  }

  private getNavbarHeight(): number {
    const navbar = document.querySelector('app-navbar');
    if (navbar) {
      return navbar.getBoundingClientRect().height;
    }
    const isMd = window.innerWidth >= 768;
    const isSm = window.innerWidth >= 640;
    const navbarInnerHeight = isMd ? 76 : (isSm ? 72 : 68);
    const paddingY = 12;
    return navbarInnerHeight + (paddingY * 2);
  }

  private getAdjustedCenterY(): number {
    const navbarHeight = this.getNavbarHeight();
    const availableHeight = window.innerHeight - navbarHeight;
    return navbarHeight + (availableHeight / 2);
  }

  private calculateBubblePositions(): void {
    // Obtener las dimensiones finales del blob en About
    const isMobile = window.innerWidth < 640;
    const baseBlobWidth = isMobile ? window.innerWidth * 0.85 : window.innerWidth * 0.65;
    const maxBlobWidth = isMobile ? 900 : 700;
    const finalBlobWidth = Math.min(baseBlobWidth, maxBlobWidth) * 1.4; // scale: 1.4

    // Calcular el factor de escala basado en el ancho final del blob vs el original
    const scale = finalBlobWidth / this.ORIGINAL_BLOB_WIDTH;

    // Calcular el centro donde debe estar el blob
    const centerX = window.innerWidth / 2;
    const centerY = this.getAdjustedCenterY();

    // La altura escalada del blob original
    const finalBlobHeight = this.ORIGINAL_BLOB_HEIGHT * scale;

    // Punto superior izquierdo del blob escalado y centrado
    const blobStartX = centerX - (finalBlobWidth / 2);
    const blobStartY = centerY - (finalBlobHeight / 2);

    // Calcular posición y tamaño de cada burbuja
    this.bubbles.forEach(bubble => {
      // Escalar dimensiones manteniendo aspect ratio
      bubble.width = bubble.originalWidth * scale;
      bubble.height = bubble.originalHeight * scale;

      // Escalar posiciones relativas
      const scaledX = bubble.originalX * scale;
      const scaledY = bubble.originalY * scale;

      // Calcular posición absoluta en pantalla
      bubble.x = blobStartX + scaledX + (bubble.offsetX || 0);
      bubble.y = blobStartY + scaledY + (bubble.offsetY || 0);
    });
  }

  private setupTitleAnimation(): void {
    const title = this.titleRef?.nativeElement;
    const section = this.sectionRef?.nativeElement;
    if (!title || !section) return;

    if (this.titleScrollTrigger) {
      this.titleScrollTrigger.kill();
      this.titleScrollTrigger = undefined;
    }

    const navbarHeight = this.getNavbarHeight();

    // Inicialmente el título está centrado en la pantalla
    gsap.set(title, {
      y: 0,
      opacity: 1,
    });

    // Animar el título para que suba hasta quedar debajo del navbar
    const animation = gsap.to(title, {
      y: -(window.innerHeight / 2 - navbarHeight - 50), // Sube hasta quedar debajo del navbar
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        markers: false,
      },
    });

    this.titleScrollTrigger = animation.scrollTrigger as ScrollTrigger;
  }

  private setupBubblesAnimation(): void {
    const section = this.sectionRef?.nativeElement;
    if (!section) return;

    if (this.bubblesScrollTrigger) {
      this.bubblesScrollTrigger.kill();
      this.bubblesScrollTrigger = undefined;
    }

    // Posicionar inicialmente todas las burbujas en su posición calculada
    this.bubbleImgs.forEach((ref, index) => {
      const bubble = this.bubbles[index];
      const img = ref.nativeElement;

      gsap.set(img, {
        x: bubble.x,
        y: bubble.y,
        width: bubble.width,
        height: bubble.height,
        opacity: 0, // Inicialmente invisible
        force3D: true,
      });
    });

    // ScrollTrigger para mostrar las burbujas cuando comienza la sección
    this.bubblesScrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      markers: false,
      onUpdate: (self) => {
        // Gradualmente hacer visible las burbujas
        this.bubbleImgs.forEach((ref) => {
          const img = ref.nativeElement;
          gsap.set(img, {
            opacity: self.progress,
          });
        });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.titleScrollTrigger) {
      this.titleScrollTrigger.kill();
    }
    if (this.bubblesScrollTrigger) {
      this.bubblesScrollTrigger.kill();
    }
  }
}
