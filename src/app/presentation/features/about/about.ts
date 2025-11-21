import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, QueryList, ViewChild, ViewChildren, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
    class: 'block',
    '(window:resize)': 'onResize()'
  }
})
export class About implements AfterViewInit, OnDestroy {
  readonly MailIcon = MailIcon;
  readonly BookOpenIcon = BookOpenIcon;
  readonly GithubIcon = GithubIcon;
  readonly LinkedinIcon = LinkedinIcon;
  readonly LINKS = LINKS;

  @ViewChild('leadRef', { static: false }) leadRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionRef', { static: false }) sectionRef!: ElementRef<HTMLElement>;
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

  onResize(): void {
    this.syncWidth();
    this.updateShapePosition();
    this.setupImageChange();
    // Esperar un tick para que la sección Skills esté renderizada
    requestAnimationFrame(() => this.setupBlobFade());
  }

  private syncWidth(): void {
    const isMobile = this.config.isMobile();

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

      // Animación de hover moderna - solo escala suave (igual que Skills)
      const tl = gsap
        .timeline({ paused: true })
        .to([img, icon], {
          scale: 1.1,
          duration: 0.5,
          ease: 'power2.out'
        });

      this.timelines.set(el, tl);
      el.addEventListener('mouseenter', () => tl.play());
      el.addEventListener('mouseleave', () => tl.reverse());
      el.addEventListener('focus', () => tl.play());
      el.addEventListener('blur', () => tl.reverse());

      // Animación de click - solo escala con bounce (igual que Skills)
      el.addEventListener('click', () => {
        gsap.timeline()
          .to([img, icon], {
            scale: 1.15,
            duration: 0.15,
            ease: 'power2.out'
          })
          .to([img, icon], {
            scale: 1,
            duration: 0.35,
            ease: 'back.out(1.4)'
          });
      });
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
    this.setupImageChange();
    this.setupBlobFade();
  }

  onContactJellyClick(event: Event): void {
    event.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    // Usar offsetWidth/Height si están disponibles y son válidos
    // El servicio se encargará de usar fallback determinístico si son 0
    this.config.setInitialBlobDimensions(img.offsetWidth, img.offsetHeight);

    // Matar el ScrollTrigger y limpiar TODAS las propiedades GSAP previas
    if (this.shapeScrollTrigger) {
      this.shapeScrollTrigger.kill();
      this.shapeScrollTrigger = undefined;
    }

    // Limpiar completamente todas las transformaciones GSAP para empezar desde cero
    gsap.set(img, { clearProps: 'all' });

    const isMobile = this.config.isMobile();

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
    const viewportCenterY = this.config.getAdjustedCenterY();

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
        trigger: isMobile ? img : this.sectionRef?.nativeElement ?? img,
        start: scrollTriggerStart,
        end: `+=${this.config.CENTERING_DURATION}`,
        scrub: true,
        markers: false,
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
    const viewportCenterY = this.config.getAdjustedCenterY();
    const isMobile = this.config.isMobile();
    const aboutSection = this.sectionRef?.nativeElement;

    this.imageChangeScrollTrigger = ScrollTrigger.create({
      trigger: aboutSection ?? img,
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

    // Ajustar estado inicial de la imagen y posición por si cargamos en medio
    const st = this.imageChangeScrollTrigger;
    if (st) {
      st.refresh();
      const progress = st.progress;
      const imageIndex = Math.floor(progress * this.config.TOTAL_IMAGES) + 1;
      const clampedIndex = Math.min(Math.max(imageIndex, 1), this.config.TOTAL_IMAGES);
      const imageNumber = String(clampedIndex).padStart(2, '0');
      img.src = `assets/3d_shape/${imageNumber}.webp`;
      gsap.set(img, {
        x: viewportCenterX - (img.offsetWidth / 2),
        y: viewportCenterY - (img.offsetHeight / 2),
        scale: this.config.BLOB_SCALE,
        rotation: this.config.getFinalRotation(isMobile),
        force3D: true,
      });
    }
  }

  private setupBlobFade(): void {
    const img = this.shapeRef?.nativeElement;
    if (!img) return;

    if (this.blobFadeScrollTrigger) {
      this.blobFadeScrollTrigger.kill();
      this.blobFadeScrollTrigger = undefined;
    }

    // Función para intentar configurar el trigger
    const trySetup = (attempts = 0) => {
      // Buscar la sección de Skills
      const skillsSection = document.querySelector('app-skills section');
      
      if (!skillsSection) {
        // Si no se encuentra y no hemos excedido los intentos (2 segundos aprox), reintentar
        if (attempts < 20) {
          requestAnimationFrame(() => trySetup(attempts + 1));
        }
        return;
      }

      this.blobFadeScrollTrigger = ScrollTrigger.create({
        trigger: skillsSection,
        start: 'top center',
        end: 'bottom center',
        markers: false,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Si el trigger está activo (skills entre start y end) O ya pasamos (progress > 0), ocultar blob
          // Esto asegura que si estamos más abajo de skills, el blob siga oculto
          const shouldHide = self.isActive || self.progress > 0;
          gsap.set(img, { opacity: shouldHide ? 0 : 1 });
        },
        onRefresh: (self) => {
          // Forzar actualización al refrescar (resize)
          const shouldHide = self.isActive || self.progress > 0;
          gsap.set(img, { opacity: shouldHide ? 0 : 1 });
        }
      });

      // Establecer estado inicial determinístico
      const skillsRect = skillsSection.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      // Si el top de skills está por encima o en el centro, ocultar
      const isPastStart = skillsRect.top <= centerY;
      gsap.set(img, { opacity: isPastStart ? 0 : 1 });
    };

    trySetup();
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
    const img = this.shapeRef?.nativeElement;
    if (img) {
      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: 'all' });
    }
  }
}