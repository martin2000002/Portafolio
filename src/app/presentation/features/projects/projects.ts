import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LucideAngularModule, X, ExternalLink, Github, Code2, Terminal, Cpu, Brain } from 'lucide-angular';
import { BlobAnimationConfigService } from '../../shared/services/blob-animation-config.service';

interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
}

interface Project {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  mainImage: string;
  gallery: ProjectImage[];
  tags: string[];
  links?: {
    demo?: string;
    repo?: string;
    doc?: string;
  };
  techStackIcons?: string[]; // Lucide icon names or paths
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
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements AfterViewInit, OnDestroy {
  @ViewChild('sectionRef') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('contentRef') contentRef!: ElementRef<HTMLElement>;
  @ViewChild('cardsRef') cardsRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('projectCard') projectCards!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('modalRef') modalRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('blobRef') blobRef!: ElementRef<HTMLImageElement>;

  readonly X = X;
  readonly ExternalLink = ExternalLink;
  readonly Github = Github;
  readonly Code2 = Code2;
  readonly Terminal = Terminal;
  readonly Cpu = Cpu;
  readonly Brain = Brain;

  selectedProject = signal<Project | null>(null);

  constructor(private readonly config: BlobAnimationConfigService) {}

  projects: Project[] = [
    {
      id: 1,
      title: 'Buscaminas 3D (MASM)',
      shortDescription: 'Versión tridimensional del clásico Buscaminas en ensamblador.',
      fullDescription: `
        <p>Este proyecto consistió en implementar una versión tridimensional del clásico Buscaminas usando lenguaje ensamblador con MASM. El juego se ejecuta sobre un cubo de tamaño 4x4 por cara, y la interfaz muestra las cuatro caras de forma separada para facilitar la interacción.</p>
        <p>La lógica maneja descubrimiento de celdas, conteo de minas adyacentes en 3D y condiciones de victoria/derrota. La implementación prioriza la eficiencia en memoria y el control detallado del flujo.</p>
      `,
      mainImage: 'assets/projects/1/main.jpeg',
      gallery: [
        { src: 'assets/projects/1/main.jpeg', alt: 'Vista principal del juego' },
        { src: 'assets/projects/1/won.jpeg', alt: 'Pantalla de victoria' },
        { src: 'assets/projects/1/lost.jpeg', alt: 'Pantalla de derrota' },
      ],
      tags: ['MASM', 'Assembler', 'Game Dev', 'Low Level'],
      techStackIcons: ['Cpu', 'Terminal'],
    },
    {
      id: 2,
      title: 'Plataforma de Programación',
      shortDescription: 'App web para ejercicios de estructuras de datos con editor Java.',
      fullDescription: `
        <p>Desarrollé una aplicación web enfocada en ejercicios de estructuras de datos, con énfasis en stacks y queues. El usuario puede elegir un ejercicio, revisar su enunciado, ver las pruebas unitarias esperadas y programar directamente en el navegador usando un editor de código integrado para Java.</p>
        <p>Al ejecutar, el sistema compila, corre los tests y reporta una calificación sobre 100 basada en los casos aprobados.</p>
      `,
      mainImage: 'assets/projects/2/main.png',
      gallery: [
        { src: 'assets/projects/2/list.png', alt: 'Listado de ejercicios' },
        { src: 'assets/projects/2/main.png', alt: 'Editor de código' },
      ],
      tags: ['Java', 'Web', 'Unit Testing', 'Education'],
      links: {
        demo: 'https://estructuradatosgrupommm.web.app/lista',
      },
      techStackIcons: ['Code2', 'Brain'],
    },
    {
      id: 3,
      title: 'Cifrado Turing Enigma',
      shortDescription: 'Visualizador web de máquina de Turing para cifrado estilo Enigma.',
      fullDescription: `
        <p>Creé una página web para visualizar el funcionamiento de una implementación tipo máquina de Turing orientada al cifrado de mensajes. El esquema de cifrado está inspirado en la documentación pública de Pringles Enigma 3A4.</p>
        <p>La herramienta permite entender paso a paso cómo se transforma el texto a medida que avanza por los rotores y reglas definidas, con modos de depuración para ver el estado interno.</p>
      `,
      mainImage: 'assets/projects/3/main.png',
      gallery: [
        { src: 'assets/projects/3/main.png', alt: 'Vista principal' },
        { src: 'assets/projects/3/debug.png', alt: 'Modo depuración' },
      ],
      tags: ['Web', 'Cryptography', 'Turing Machine', 'Education'],
      links: {
        demo: 'https://teoriacomputaciongrupo4.web.app/',
        doc: 'https://franklinheath.co.uk/wp-content/uploads/2012/05/pringlesenigma3a4.pdf',
      },
      techStackIcons: ['Code2', 'Cpu'],
    },
    {
      id: 4,
      title: 'Automatización de RRHH',
      shortDescription: 'App de escritorio para clasificación de candidatos con OCR y LLM.',
      fullDescription: `
        <p>Aplicación de escritorio diseñada para automatizar el flujo de preclasificación de candidatos en procesos de convocatoria. Permite organizar currículums, hacer formateo y preprocesamiento (incluyendo OCR), y generar PDFs unificados.</p>
        <p>Incorpora un módulo de análisis asistido por LLM para consolidar resultados y exportarlos a Excel, facilitando la toma de decisiones.</p>
      `,
      mainImage: 'assets/projects/4/main.png',
      gallery: [
        { src: 'assets/projects/4/main.png', alt: 'Pantalla principal' },
        { src: 'assets/projects/4/formateo.png', alt: 'Módulo de formateo' },
        { src: 'assets/projects/4/analisis.png', alt: 'Análisis con LLM' },
      ],
      tags: ['Python', 'Desktop App', 'OCR', 'LLM', 'Automation'],
      techStackIcons: ['Terminal', 'Brain'],
    },
  ];

  private scrollTrigger?: ScrollTrigger;
  private contactScrollTrigger?: ScrollTrigger;
  private contactFloatTween?: gsap.core.Tween;
  private blobDimensions = { width: 0, height: 0 };
  private lastBlobPosition = { x: 0, y: 0 };
  private readonly onSkillsBlobFinished = (event: Event) => this.handleSkillsBlobFinished(event as CustomEvent<BlobSyncPayload>);
  private readonly onSkillsBlobReset = () => this.handleSkillsBlobReset();
  private readonly onSkillsBlobTakeover = () => this.handleSkillsBlobTakeover();

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupBlobPosition();
    this.setupScrollAnimation();
    this.setupContactTransition();
    document.addEventListener('skills-blob-finished', this.onSkillsBlobFinished);
    document.addEventListener('skills-blob-reset', this.onSkillsBlobReset);
    document.addEventListener('skills-blob-takeover', this.onSkillsBlobTakeover);
  }

  private setupBlobPosition(): void {
    if (!this.blobRef?.nativeElement) return;
    
    const blob = this.blobRef.nativeElement;
    const isMobile = this.config.isMobile();
    
    const expected = this.config.calculateExpectedBlobDimensions();
    const blobWidth = blob.offsetWidth || expected.width;
    const blobHeight = blob.offsetHeight || expected.height;
    this.blobDimensions = { width: blobWidth, height: blobHeight };
    
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const startX = viewportCenterX - blobWidth / 2;
    const startY = viewportCenterY - blobHeight / 2;
    
    gsap.set(blob, {
      x: startX,
      y: startY,
      scale: this.config.BLOB_SCALE,
      rotation: this.config.getFinalRotation(isMobile),
      transformOrigin: 'center center',
      force3D: true,
      opacity: 0,
    });
    this.lastBlobPosition = { x: startX, y: startY };
  }

  private setupScrollAnimation(): void {
    const section = this.sectionRef.nativeElement;
    const content = this.contentRef.nativeElement;
    const blob = this.blobRef.nativeElement;

    // Initial state: Content starts below
    gsap.set(content, { y: 100, opacity: 0 });
    
    // Calculate target Y for the content container so that the title ends up at Navbar + 10px
    const navbarHeight = this.config.getNavbarHeight();
    
    // Calculate dynamic offset to ensure precision
    // We need the title's offset relative to the content container
    const titleEl = content.querySelector('h2');
    let titleOffset = 180; // Fallback (80px padding-top section + 100px padding-top content)
    
    if (titleEl) {
      // Get styles to check for margins
      const style = window.getComputedStyle(titleEl);
      const marginTop = parseFloat(style.marginTop) || 0;
      // The content container has pt-[100px] and section has py-20 (80px)
      // So visually the title is at 180px + marginTop from the section top
      titleOffset = 180 + marginTop;
    }

    // Target Y = navbarHeight + 10
    // We want: titleOffset + translateY = navbarHeight + 10
    // translateY = (navbarHeight + 10) - titleOffset
    const finalContainerY = (navbarHeight + 10) - titleOffset;

    // Create a timeline for the scroll animation
    // NO PINNING to avoid "sticky bottom" effect
    // Animate as the section enters the viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom', // Start when section top hits viewport bottom
        end: 'top top+=100', // End when section top is near top (adjusted for navbar)
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    // Animate content up to calculated position
    tl.to(content, { 
      y: finalContainerY, 
      opacity: 1, 
      duration: 1,
      ease: 'power1.out'
    });

    this.scrollTrigger = tl.scrollTrigger;

  }

  private getBlobDimensions(): { width: number; height: number } {
    if (!this.blobDimensions.width || !this.blobDimensions.height) {
      const expected = this.config.calculateExpectedBlobDimensions();
      this.blobDimensions = { width: expected.width, height: expected.height };
    }
    return this.blobDimensions;
  }

  private moveBlobTo(centerX: number, centerY: number, scale: number, duration = 0.8): void {
    const blob = this.blobRef.nativeElement;
    const { width, height } = this.getBlobDimensions();
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    this.lastBlobPosition = { x, y };
    gsap.to(blob, {
      x,
      y,
      scale,
      duration,
      ease: 'power2.out',
    });
  }

  private handleSkillsBlobFinished(event: CustomEvent<BlobSyncPayload>): void {
    const detail = event.detail;
    if (!detail) return;
    const blob = this.blobRef.nativeElement;
    this.stopContactFloat();
    const { width, height } = this.getBlobDimensions();
    const startX = detail.centerX - width / 2;
    const startY = detail.centerY - height / 2;

    gsap.set(blob, {
      opacity: 1,
      x: startX,
      y: startY,
      scale: detail.scale,
      rotation: detail.rotation,
    });
    this.lastBlobPosition = { x: startX, y: startY };
    this.moveBlobToProjectsState();
  }

  private handleSkillsBlobReset(): void {
    const blob = this.blobRef.nativeElement;
    this.stopContactFloat();
    gsap.set(blob, { opacity: 0 });
  }

  private getProjectsBlobTarget(): { centerX: number; centerY: number; scale: number } {
    const cards = this.cardsRef?.nativeElement;
    if (cards) {
      const rect = cards.getBoundingClientRect();
      const width = window.innerWidth;
      const centerX = rect.left + rect.width / 2;

      if (width < 768) {
        const centerY = rect.top + rect.height / 2;
        const scale = this.config.BLOB_SCALE * 0.66;
        return { centerX, centerY, scale };
      }

      const gap = Math.min(window.innerHeight * 0.12, 140);
      const centerY = Math.min(rect.bottom + gap, window.innerHeight - 80);
      const scale = this.config.BLOB_SCALE * (width >= 1280 ? 0.78 : 0.74);
      return { centerX, centerY, scale };
    }
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.7;
    const scale = this.config.BLOB_SCALE * 0.78;
    return { centerX, centerY, scale };
  }

  private getContactBlobTarget(): { centerX: number; centerY: number; scale: number } {
    const isDesktop = window.innerWidth >= 1024;
    const { width } = this.getBlobDimensions();
    if (isDesktop) {
      const scale = this.config.BLOB_SCALE * 0.68;
      const scaledWidth = width * scale;
      const margin = 48;
      const centerX = Math.min(window.innerWidth - scaledWidth / 2 - margin, window.innerWidth - 180);
      const contactCard = document.getElementById('contact-card');
      const contactAnchor = contactCard ?? document.getElementById('contact');
      let centerY = window.innerHeight / 2;
      if (contactAnchor) {
        const rect = contactAnchor.getBoundingClientRect();
        centerY = rect.top + rect.height / 2;
      }
      const upperBound = window.innerHeight * 0.35;
      const lowerBound = window.innerHeight * 0.65;
      centerY = Math.min(Math.max(centerY, upperBound), lowerBound);
      return { centerX, centerY, scale };
    }

    const mobileScale = this.config.BLOB_SCALE * 0.62;
    let centerY = window.innerHeight - 120;
    const mobileAnchor = document.getElementById('contact-card') ?? document.getElementById('contact');
    if (mobileAnchor) {
      const rect = mobileAnchor.getBoundingClientRect();
      centerY = Math.min(rect.bottom + 20, window.innerHeight - 80);
    }
    return {
      centerX: window.innerWidth / 2,
      centerY,
      scale: mobileScale,
    };
  }

  private getSkillsBlobTarget(): { centerX: number; centerY: number; scale: number } {
    return {
      centerX: window.innerWidth / 2,
      centerY: this.config.getAdjustedCenterY(),
      scale: this.config.BLOB_SCALE,
    };
  }

  private moveBlobToProjectsState(): void {
    const { centerX, centerY, scale } = this.getProjectsBlobTarget();
    this.stopContactFloat();
    gsap.set(this.blobRef.nativeElement, { opacity: 1 });
    this.moveBlobTo(centerX, centerY, scale);
  }

  private moveBlobToContactState(): void {
    const target = this.getContactBlobTarget();
    gsap.set(this.blobRef.nativeElement, { opacity: 1 });
    this.moveBlobTo(target.centerX, target.centerY, target.scale);
    this.startContactFloat();
  }

  private startContactFloat(): void {
    this.stopContactFloat();
    const baseY = this.lastBlobPosition.y;
    this.contactFloatTween = gsap.to(this.blobRef.nativeElement, {
      y: baseY + 12,
      duration: 2.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  private stopContactFloat(): void {
    if (this.contactFloatTween) {
      this.contactFloatTween.kill();
      this.contactFloatTween = undefined;
      gsap.set(this.blobRef.nativeElement, { y: this.lastBlobPosition.y });
    }
  }

  private setupContactTransition(): void {
    if (this.contactScrollTrigger) return;
    const contactSection = document.getElementById('contact');
    if (!contactSection) {
      setTimeout(() => this.setupContactTransition(), 200);
      return;
    }

    this.contactScrollTrigger = ScrollTrigger.create({
      trigger: contactSection,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => this.moveBlobToContactState(),
      onLeaveBack: () => this.moveBlobToProjectsState(),
    });
  }

  private handleSkillsBlobTakeover(): void {
    if (!this.blobRef?.nativeElement) return;
    const blob = this.blobRef.nativeElement;
    const { centerX, centerY, scale } = this.getSkillsBlobTarget();
    const { width, height } = this.getBlobDimensions();
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    this.stopContactFloat();
    this.lastBlobPosition = { x, y };
    gsap.to(blob, {
      x,
      y,
      scale,
      opacity: 0,
      duration: 0.65,
      ease: 'power2.inOut',
    });
  }

  openProject(project: Project): void {
    this.selectedProject.set(project);
    // Small delay to allow dialog to render
    setTimeout(() => {
      this.modalRef.nativeElement.showModal();
      document.body.style.overflow = 'hidden'; // Prevent background scroll
      
      // Animate modal entry
      gsap.fromTo(this.modalRef.nativeElement, 
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.2)' }
      );
    }, 0);
  }

  closeModal(): void {
    const dialog = this.modalRef.nativeElement;
    
    gsap.to(dialog, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      onComplete: () => {
        dialog.close();
        this.selectedProject.set(null);
        document.body.style.overflow = '';
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.modalRef.nativeElement) {
      this.closeModal();
    }
  }

  ngOnDestroy(): void {
    this.scrollTrigger?.kill();
    this.contactScrollTrigger?.kill();
    this.contactFloatTween?.kill();
    document.removeEventListener('skills-blob-finished', this.onSkillsBlobFinished);
    document.removeEventListener('skills-blob-reset', this.onSkillsBlobReset);
    document.removeEventListener('skills-blob-takeover', this.onSkillsBlobTakeover);
  }
}
