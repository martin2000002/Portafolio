import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { LucideAngularModule, MailIcon, BookOpenIcon, GithubIcon, LinkedinIcon } from 'lucide-angular';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LINKS } from '../../shared/constants/links.constant';
import { BlobAnimationConfigService } from '../../shared/services/blob-animation-config.service';

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
  private imageChangeScrollTrigger?: ScrollTrigger;
  private blobFadeScrollTrigger?: ScrollTrigger;
  private ro?: ResizeObserver;
  private updateShapePositionBound = () => this.updateShapePosition();
  currentImageIndex = 1;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    readonly config: BlobAnimationConfigService
  ) {}

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
    this.setupImageChange();
    // Esperar un tick para que la sección Skills esté renderizada
    requestAnimationFrame(() => this.setupBlobFade());
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

  private getNavbarHeight(): number {
    return this.config.getNavbarHeight();
  }

  private getAvailableViewportHeight(): number {
    return this.config.getAvailableViewportHeight();
  }

  private getAdjustedCenterY(): number {
    return this.config.getAdjustedCenterY();
  }

  private setupShapeScrollAnim(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    this.ensurePositionObservers();
    this.updateShapePosition();
    requestAnimationFrame(() => this.updateShapePosition());
    this.setupImageChange();
    this.setupBlobFade();
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

    // Establecer las dimensiones iniciales del blob en el servicio
    // Esto se hace cada vez que se actualiza la posición (resize, load, etc.)
    this.config.setInitialBlobDimensions(img.offsetWidth, img.offsetHeight);

    // Matar el ScrollTrigger y limpiar TODAS las propiedades GSAP previas
    if (this.shapeScrollTrigger) {
      this.shapeScrollTrigger.kill();
      this.shapeScrollTrigger = undefined;
    }

    // Limpiar completamente todas las transformaciones GSAP para empezar desde cero
    gsap.set(img, { clearProps: 'all' });

    const isMobile = window.innerWidth < 640;

    const initialRotation = this.config.getInitialRotation(isMobile);
    const finalRotation = this.config.getFinalRotation(isMobile);
    let initialX = 0;
    let initialY = 0;

    if (isMobile) {
      const jelliesMobile = this.jelliesMobileRef?.nativeElement;
      if (!jelliesMobile) return;

      const jelliesRect = jelliesMobile.getBoundingClientRect();
      initialX = (window.innerWidth - img.offsetWidth) / 2;
      // Convertir a posición absoluta sumando el scroll actual
      initialY = jelliesRect.bottom + window.scrollY + 40;
    } else {
      const profileImg = this.profileRef?.nativeElement;
      if (!profileImg) return;

      const profileRect = profileImg.getBoundingClientRect();
      initialX = profileRect.right + 50 - img.offsetWidth;
      // Convertir a posición absoluta sumando el scroll actual
      initialY = profileRect.bottom + window.scrollY + 20;
    }

    // Establecer posición inicial de manera determinística
    gsap.set(img, {
      x: initialX,
      y: initialY,
      scale: 1,
      rotation: initialRotation,
      force3D: true,
    });

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = this.getAdjustedCenterY();

    // Crear la animación con valores absolutos
    // En mobile: inicia cuando el blob entra en viewport (top del blob toca bottom del viewport)
    // En desktop: inicia después del offset estándar
    const scrollTriggerStart = isMobile
      ? `top bottom+=${this.config.CENTERING_START_OFFSET}` // Cuando el top del blob toque el bottom del viewport
      : `top top+=${this.config.CENTERING_START_OFFSET}`;

    const animation = gsap.to(img, {
      x: viewportCenterX - (img.offsetWidth / 2),
      y: viewportCenterY - (img.offsetHeight / 2),
      scale: this.config.BLOB_SCALE,
      rotation: finalRotation,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: isMobile ? img : 'section',
        start: scrollTriggerStart,
        end: `+=${this.config.CENTERING_DURATION}`,
        scrub: true,
        markers: true,
        invalidateOnRefresh: true, // Recalcular valores en cada refresh
      },
    });

    this.shapeScrollTrigger = animation.scrollTrigger as ScrollTrigger;
  }

  private setupImageChange(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    // Limpiar ScrollTrigger previo si existe
    if (this.imageChangeScrollTrigger) {
      this.imageChangeScrollTrigger.kill();
      this.imageChangeScrollTrigger = undefined;
    }

    // Este ScrollTrigger SOLO se activa DESPUÉS de que termine la animación de centrado
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = this.getAdjustedCenterY();
    const isMobile = window.innerWidth < 640;

    this.imageChangeScrollTrigger = ScrollTrigger.create({
      trigger: 'section',
      start: `top top-=${this.config.CENTERING_END}`, // Empieza DESPUÉS de que la animación termine
      end: `top top-=${this.config.SEQUENCE_END}`, // Scroll total para todas las imágenes
      scrub: true,
      markers: false,
      onUpdate: (self) => {
        // Mantener el blob centrado y con el mismo tamaño durante todo el cambio de imágenes
        gsap.set(img, {
          x: viewportCenterX - (img.offsetWidth / 2),
          y: viewportCenterY - (img.offsetHeight / 2),
          scale: this.config.BLOB_SCALE,
          rotation: this.config.getFinalRotation(isMobile),
          force3D: true,
        });

        // Calcular qué imagen mostrar basado en el progreso
        // progress va de 0 a 1, lo multiplicamos por el total de imágenes
        const imageIndex = Math.floor(self.progress * this.config.TOTAL_IMAGES) + 1;
        const clampedIndex = Math.min(Math.max(imageIndex, 1), this.config.TOTAL_IMAGES);

        if (clampedIndex !== this.currentImageIndex) {
          this.currentImageIndex = clampedIndex;
          // Formatear el número con ceros a la izquierda (01, 02, ..., 25)
          const imageNumber = String(clampedIndex).padStart(2, '0');
          img.src = `assets/3d_shape/${imageNumber}.webp`;
        }
      }
    });
  }

  private setupBlobFade(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    if (this.blobFadeScrollTrigger) {
      this.blobFadeScrollTrigger.kill();
      this.blobFadeScrollTrigger = undefined;
    }

    // Buscar la sección de Skills para ocultar el blob cuando llegue
    const skillsSection = document.querySelector('app-skills section');
    if (!skillsSection) return;

    this.blobFadeScrollTrigger = ScrollTrigger.create({
      trigger: skillsSection,
      start: 'top center',
      end: 'top center',
      markers: false,
      onEnter: () => {
        // Ocultar el blob instantáneamente cuando la sección Skills llega al centro
        gsap.set(img, { opacity: 0 });
      },
      onLeaveBack: () => {
        // Mostrar el blob instantáneamente cuando se hace scroll hacia atrás
        gsap.set(img, { opacity: 1 });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.shapeScrollTrigger) {
      this.shapeScrollTrigger.kill();
    }
    if (this.imageChangeScrollTrigger) {
      this.imageChangeScrollTrigger.kill();
    }
    if (this.blobFadeScrollTrigger) {
      this.blobFadeScrollTrigger.kill();
    }
    if (this.ro) {
      this.ro.disconnect();
    }
  }
}