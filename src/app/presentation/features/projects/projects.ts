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

  readonly X = X;
  readonly ExternalLink = ExternalLink;
  readonly Github = Github;
  readonly Code2 = Code2;
  readonly Terminal = Terminal;
  readonly Cpu = Cpu;
  readonly Brain = Brain;

  selectedProject = signal<Project | null>(null);

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
    this.setupScrollAnimation();
  }

  private setupScrollAnimation(): void {
    const section = this.sectionRef.nativeElement;
    const content = this.contentRef.nativeElement;
    const cards = this.projectCards.map(c => c.nativeElement);

    // Initial state
    gsap.set(content, { y: 100, opacity: 0 });
    gsap.set(cards, { y: 50, opacity: 0 });

    this.scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top center', // Adjust as needed based on where Skills ends
      end: '+=100%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        // Animation logic based on scroll progress
        const progress = self.progress;
        
        // Fade in content
        if (progress < 0.2) {
          gsap.to(content, { y: 0, opacity: 1, duration: 0.5, overwrite: true });
        }

        // Stagger cards appearance
        if (progress > 0.1) {
           gsap.to(cards, {
             y: 0,
             opacity: 1,
             stagger: 0.1,
             duration: 0.5,
             overwrite: true
           });
        }
      }
    });
    
    // Alternative approach: Timeline linked to scrub
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top bottom", // When top of section hits bottom of viewport
            end: "center center", // When center of section hits center of viewport
            scrub: 1,
        }
    });

    tl.to(content, { y: 0, opacity: 1, duration: 1 })
      .to(cards, { y: 0, opacity: 1, stagger: 0.2, duration: 1 }, "-=0.5");
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
