import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { LucideAngularModule, SunIcon, MoonIcon, MenuIcon, UserIcon, SparklesIcon, FolderGit2Icon, MailIcon } from 'lucide-angular';
import { gsap } from 'gsap';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block sticky top-0 z-50'
  }
})
export class Navbar implements AfterViewInit, OnDestroy {
  readonly MenuIcon = MenuIcon;
  readonly SunIcon = SunIcon;
  readonly MoonIcon = MoonIcon;
  private readonly theme = inject(ThemeService);

  readonly isDark = computed(() => this.theme.mode() === 'dark');

  @ViewChild('themeBtn', { static: true }) private themeBtn!: ElementRef<HTMLElement>;
  @ViewChild('menuBtn', { static: true }) private menuBtn!: ElementRef<HTMLElement>;
  @ViewChild('overlay') private overlay?: ElementRef<HTMLElement>;
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChildren('menuItem') private menuItemEls?: QueryList<ElementRef<HTMLElement>>;

  private cleanupFns: Array<() => void> = [];
  readonly menuOpen = signal(false);

  readonly menuItems = [
    { label: 'About', icon: UserIcon, section: 'about' },
    { label: 'Skills', icon: SparklesIcon, section: 'skills' },
    { label: 'Projects', icon: FolderGit2Icon, section: 'projects' },
    { label: 'Contact', icon: MailIcon, section: 'contact' },
  ] as const;

  toggleTheme(): void {
    this.theme.toggle();
  }

  onMenuItemClick(sectionId: string): void {
    this.closeMenu();

    // Esperar a que el menú se cierre antes de scrollear
    setTimeout(() => {
      if (sectionId === 'skills') {
        this.scrollToSkillsAnchor();
      } else if (sectionId === 'projects') {
        this.scrollToProjects();
      } else if (sectionId === 'about') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Para otras secciones, scroll normal
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 300);
  }

  private scrollToSkillsAnchor(): void {
    // Buscar la sección de Skills
    const skillsSection = document.querySelector('app-skills section');
    if (!skillsSection) return;

    const isMobile = window.innerWidth < 640;
    const sectionTop = (skillsSection as HTMLElement).offsetTop;
    const viewportCenter = window.innerHeight / 2;
    const phase1Duration = isMobile ? 500 : 700;

    // Calcular la posición de scroll del punto de anclaje (fase 2)
    const scrollPosition = sectionTop - viewportCenter + phase1Duration;

    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth',
    });
  }

  private scrollToProjects(): void {
    // Usar la misma lógica que Skills para posicionar el título en navbar + 10px
    const projectsSection = document.getElementById('projects');
    if (!projectsSection) return;

    const isMobile = window.innerWidth < 640;
    const sectionTop = projectsSection.offsetTop;
    const viewportCenter = window.innerHeight / 2;
    
    // Projects tiene una animación que mueve el contenido desde 'top bottom' a 'top top+100'
    // Para que el título quede en navbar + 10, necesitamos scrollear hasta que la sección
    // esté en la posición 'top top+100' (similar a Skills Phase 2)
    // Esto significa: sectionTop debe estar a 100px del top del viewport
    const scrollPosition = sectionTop - 100;

    window.scrollTo({
      top: scrollPosition,
      behavior: 'smooth',
    });
  }

  ngAfterViewInit(): void {
    [this.themeBtn?.nativeElement, this.menuBtn?.nativeElement]
      .filter((el): el is HTMLElement => !!el)
      .forEach((el) => this.attachIconInteractions(el));
  }

  private readonly outsideCloseEffect = effect((onCleanup) => {
    if (!this.menuOpen()) return;

    const onPointerDown = (ev: Event) => {
      const panelEl = this.panel?.nativeElement;
      const btnEl = this.menuBtn?.nativeElement;
      const target = ev.target as Node | null;
      if (!panelEl) {
        this.menuOpen.set(false);
        return;
      }
      if ((target && panelEl.contains(target)) || (btnEl && target && btnEl.contains(target))) {
        return;
      }
      this.closeMenu();
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') this.closeMenu();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    onCleanup(() => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    });
  });
    

  ngOnDestroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    gsap.killTweensOf([this.themeBtn?.nativeElement, this.menuBtn?.nativeElement]);
  }

  private attachIconInteractions(el: HTMLElement): void {
    const onEnter = () => gsap.to(el, { scale: 1.08, duration: 0.18, ease: 'power2.out' });
    const onLeave = () => gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.inOut' });
    const onDown = () => gsap.to(el, { scale: 0.95, duration: 0.08, ease: 'power1.out' });
    const onUp = () => gsap.to(el, { scale: 1.05, duration: 0.12, ease: 'power1.out' });

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, { passive: true } as AddEventListenerOptions);
    el.addEventListener('touchend', onUp);

    this.cleanupFns.push(() => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchstart', onDown as EventListener);
      el.removeEventListener('touchend', onUp as EventListener);
    });
  }

  onMenuClick(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    this.menuOpen.set(true);
    queueMicrotask(() => this.animateOpen());
  }

  closeMenu(): void {
    const panel = this.panel?.nativeElement;
    const items = this.menuItemEls?.map((r) => r.nativeElement) ?? [];
    if (!panel) {
      this.menuOpen.set(false);
      return;
    }
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => this.menuOpen.set(false),
    });
    tl.to(items, { y: 10, opacity: 0, duration: 0.15, stagger: { each: 0.03, from: 'end' } }, 0)
      .to(panel, { y: -8, opacity: 0, duration: 0.22 }, '<');
  }

  private animateOpen(): void {
    const panel = this.panel?.nativeElement;
    const items = this.menuItemEls?.map((r) => r.nativeElement) ?? [];
    if (!panel) return;

    gsap.set(panel, { opacity: 0, y: -8, transformOrigin: 'top right' });
    if (items.length) gsap.set(items, { y: 8, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(panel, { y: 0, opacity: 1, duration: 0.24 })
      .to(items, { y: 0, opacity: 1, duration: 0.22, stagger: 0.06 }, '-=0.05');
  }
}
