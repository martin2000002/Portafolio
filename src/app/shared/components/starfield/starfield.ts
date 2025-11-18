import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

interface Star {
  left: number;
  originalTop: number;
  currentTop: number;
  size: number;
  opacity: number;
  // Propiedades para animación manual (más performante que GSAP para este caso)
  driftX: number;
  driftY: number;
  driftSpeedX: number;
  driftSpeedY: number;
  phase: number;
  // Velocidad adicional por impulso del mouse
  velocityX: number;
  velocityY: number;
}

@Component({
  selector: 'app-starfield',
  imports: [],
  templateUrl: './starfield.html',
  styleUrl: './starfield.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarfieldComponent implements AfterViewInit, OnDestroy {
  stars: Star[] = [];
  @ViewChildren('starEl') private starEls?: QueryList<ElementRef<HTMLSpanElement>>;

  private tileHeight = 0;
  private rafId?: number;
  private mouseX = 0; // Posición X del mouse en pixels
  private mouseY = 0; // Posición Y del mouse en pixels
  private prevMouseX = 0; // Posición anterior del mouse (para calcular velocidad)
  private prevMouseY = 0;
  private mouseVelocityX = 0; // Velocidad del mouse
  private mouseVelocityY = 0;
  private time = 0;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
    this.animate();
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    try {
      const els = this.starEls?.map((r) => r.nativeElement) ?? [];
      if (els.length) gsap.killTweensOf(els);
    } catch {
    }
  }

  private handleResize = () => {
    this.tileHeight = window.innerHeight * 2;
    this.generate();
  };

  private handleMouseMove = (e: MouseEvent) => {
    // Actualizar posición del mouse
    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  private generate(): void {
    const w = window.innerWidth;
    const h = this.tileHeight;
    // Reducir densidad de estrellas para mejor performance
    const count = Math.floor((w * h) * 0.000055); // Antes era 0.00007
    const stars: Star[] = [];

    // 3 tiles for loop
    for (let tile = 0; tile < 3; tile++) {
      for (let i = 0; i < count; i++) {
        const originalTop = Math.random() * h + (tile * h) - h;
        stars.push({
          left: Math.random() * w,
          originalTop,
          currentTop: originalTop,
          size: Math.random() * 5 + 1.5, // Estrellas más pequeñas
          opacity: 0.3 + Math.random() * 0.5, // Menos opacas
          // Drift más visible
          driftX: 0,
          driftY: 0,
          driftSpeedX: (Math.random() - 0.5) * 0.8, // Velocidad más rápida (antes 0.3)
          driftSpeedY: (Math.random() - 0.5) * 0.8,
          phase: Math.random() * Math.PI * 2, // Para variación en el movimiento
          // Velocidad del impulso del mouse
          velocityX: 0,
          velocityY: 0,
        });
      }
    }

    this.stars = stars;
    this.cdr.markForCheck();
  }

  private animate = () => {
    const scrollY = window.scrollY;
    this.time += 0.016; // ~60fps

    // Calcular velocidad del mouse de manera suavizada
    const instantMouseVelX = this.mouseX - this.prevMouseX;
    const instantMouseVelY = this.mouseY - this.prevMouseY;

    // Interpolar suavemente la velocidad del mouse (efecto de "inercia" en la detección)
    const smoothingFactor = 0.15; // Qué tan rápido se adapta a cambios del mouse (más bajo = más smooth)
    this.mouseVelocityX += (instantMouseVelX - this.mouseVelocityX) * smoothingFactor;
    this.mouseVelocityY += (instantMouseVelY - this.mouseVelocityY) * smoothingFactor;

    const els = this.starEls?.toArray() ?? [];

    this.stars.forEach((star, i) => {
      // Actualizar posición de scroll
      star.currentTop = star.originalTop - scrollY;

      if (star.currentTop < -this.tileHeight) {
        star.currentTop += this.tileHeight * 3;
      }
      else if (star.currentTop > this.tileHeight * 2) {
        star.currentTop -= this.tileHeight * 3;
      }

      // Drift orgánico más visible usando sin/cos
      const driftAmount = 40; // Más movimiento (antes era 15px)
      star.driftX = Math.sin(this.time * star.driftSpeedX + star.phase) * driftAmount;
      star.driftY = Math.cos(this.time * star.driftSpeedY + star.phase) * driftAmount;

      // Aplicar transformación directamente al DOM (más rápido que GSAP para esto)
      const el = els[i]?.nativeElement;
      if (el) {
        // Calcular distancia de la estrella al mouse
        const distToMouseX = star.left - this.mouseX;
        const distToMouseY = star.currentTop - this.mouseY;
        const distToMouse = Math.sqrt(distToMouseX * distToMouseX + distToMouseY * distToMouseY);

        // Radio de influencia del mouse (100px)
        const influenceRadius = 200;

        if (distToMouse < influenceRadius && distToMouse > 0) {
          // Calcular factor de influencia (1 cuando está encima del mouse, 0 a 100px de distancia)
          const influenceFactor = 1 - (distToMouse / influenceRadius);

          // Transferir velocidad SUAVIZADA del mouse a la estrella
          // Usa la velocidad interpolada, no la instantánea
          const velocityTransfer = 0.3; // Reducido para que sea más sutil
          star.velocityX += this.mouseVelocityX * influenceFactor * velocityTransfer;
          star.velocityY += this.mouseVelocityY * influenceFactor * velocityTransfer;
        }

        // Física espacial: casi sin fricción (como en el vacío del espacio)
        // Solo un damping mínimo para evitar que se aceleren infinitamente
        const damping = 0.97; // Fricción casi nula (pierde solo 0.5% por frame)
        star.velocityX *= damping;
        star.velocityY *= damping;

        // Límite suave: si la estrella se está alejando mucho del drift natural,
        // aplicar una fuerza de retorno muy sutil (como gravedad débil)
        const maxOffset = 1000; // Máximo desplazamiento permitido desde el drift
        const currentOffsetX = star.velocityX;
        const currentOffsetY = star.velocityY;
        const currentOffsetMagnitude = Math.sqrt(currentOffsetX * currentOffsetX + currentOffsetY * currentOffsetY);

        if (currentOffsetMagnitude > maxOffset) {
          // Aplicar fuerza de retorno muy sutil hacia el drift natural
          const returnForce = 0.02; // Fuerza muy débil
          star.velocityX -= (currentOffsetX / currentOffsetMagnitude) * returnForce * (currentOffsetMagnitude - maxOffset);
          star.velocityY -= (currentOffsetY / currentOffsetMagnitude) * returnForce * (currentOffsetMagnitude - maxOffset);
        }

        // Acumular la posición del drift con la velocidad del impulso
        const totalX = star.driftX + star.velocityX;
        const totalY = star.driftY + star.velocityY;

        el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0)`;
      }
    });

    this.cdr.markForCheck();
    this.rafId = requestAnimationFrame(this.animate);
  };
}
