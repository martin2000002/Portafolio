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

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.setupBlobPosition();
    this.setupScrollAnimation();
  }

  private setupBlobPosition(): void {
    if (!this.blobRef?.nativeElement) return;
    
    const blob = this.blobRef.nativeElement;
    const isMobile = this.config.isMobile();
    
    // Usar la misma lógica que en Skills para posicionar el blob
    const expected = this.config.calculateExpectedBlobDimensions();
    const blobWidth = blob.offsetWidth || expected.width;
    const blobHeight = blob.offsetHeight || expected.height;
    
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = this.config.getAdjustedCenterY();
    
    gsap.set(blob, {
      x: viewportCenterX - (blobWidth / 2),
      y: viewportCenterY - (blobHeight / 2),
      scale: this.config.BLOB_SCALE,
      rotation: this.config.getFinalRotation(isMobile),
      force3D: true
    });
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
        scrub: 0.5,
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

    // Separate trigger for blob visibility and animation
    // Starts when Projects section reaches the top of the viewport (sync with Skills Phase 5 end)
    ScrollTrigger.create({
      trigger: section,
      start: 'top top', 
      end: 'bottom top', 
      onEnter: () => {
        // Instant appearance to match Skills end state (no fade)
        gsap.set(blob, { opacity: 1 }); 
        
        // Animate scale (time-based, no scrub)
        gsap.to(blob, {
          scale: this.config.BLOB_SCALE * 0.8,
          duration: 1.5,
          ease: 'power2.out'
        });
      },
      onLeave: () => gsap.to(blob, { opacity: 0, duration: 0.3 }),
      onEnterBack: () => {
        gsap.set(blob, { opacity: 1 });
        // Restore scale if needed or let it stay
      },
      onLeaveBack: () => {
        // Instant disappear to match Skills start state (no fade)
        gsap.set(blob, { opacity: 0 }); 
        // Reset scale for next entry
        gsap.set(blob, { scale: this.config.BLOB_SCALE });
      },
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
  }
}
