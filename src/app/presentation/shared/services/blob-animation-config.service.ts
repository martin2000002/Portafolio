import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para la configuración de las animaciones del blob 3D
 *
 * Este servicio garantiza que todas las animaciones estén sincronizadas:
 * 1. Animación de centrado del blob (About)
 * 2. Animación de transformación blob -> bubbles (About)
 * 3. Animación de aparición de bubbles individuales (Skills)
 */
@Injectable({
  providedIn: 'root'
})
export class BlobAnimationConfigService {

  // ==========================================
  // CONFIGURACIÓN DE SCROLL - ANIMACIÓN 1
  // ==========================================

  /**
   * Píxeles de scroll antes de empezar a centrar el blob (valor base para desktop)
   */

  /**
   * Obtiene el offset de inicio dinámicamente según el dispositivo y aspect ratio
   */
  get CENTERING_START_OFFSET(): number {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      const aspectRatio = window.innerHeight / window.innerWidth;
      // Si el aspect ratio es <= 1.8 (dispositivos más cuadrados), usar offset 100
      // Si es > 1.8 (dispositivos muy alargados), usar offset 0
      return aspectRatio <= 1.8 ? 80 : 0;
    }

    // Desktop: siempre 100
    return 100;
  }

  /**
   * Píxeles de scroll que toma centrar el blob
   * Controla la velocidad de la animación de centrado
   */
  readonly CENTERING_DURATION = 800;

  /**
   * Punto final de la animación de centrado
   * Calculado: CENTERING_START_OFFSET + CENTERING_DURATION
   */
  get CENTERING_END(): number {
    return this.CENTERING_START_OFFSET + this.CENTERING_DURATION;
  }

  // ==========================================
  // CONFIGURACIÓN DE SCROLL - ANIMACIÓN 2
  // ==========================================

  /**
   * Total de imágenes en la secuencia de transformación
   */
  readonly TOTAL_IMAGES = 25;

  /**
   * Píxeles de scroll por cada cambio de imagen
   * Controla la velocidad de la secuencia de transformación
   */
  readonly PIXELS_PER_IMAGE = 50;

  /**
   * Distancia total de scroll para la secuencia completa
   * Calculado: TOTAL_IMAGES * PIXELS_PER_IMAGE
   */
  get SEQUENCE_DURATION(): number {
    return this.TOTAL_IMAGES * this.PIXELS_PER_IMAGE;
  }

  /**
   * Punto donde termina la secuencia de transformación
   * Calculado: CENTERING_END + SEQUENCE_DURATION
   */
  get SEQUENCE_END(): number {
    return this.CENTERING_END + this.SEQUENCE_DURATION;
  }

  // ==========================================
  // CONFIGURACIÓN DE TAMAÑO Y ESCALA
  // ==========================================

  /**
   * Margen alrededor del blob cuando está centrado (en píxeles)
   */
  readonly BLOB_MARGIN = 10;

  /**
   * Dimensiones iniciales del blob (obtenidas del DOM)
   * Se establecen desde el componente About cuando se renderiza
   */
  private initialBlobDimensions: { width: number; height: number } | null = null;

  /**
   * Calcula las dimensiones esperadas del blob basándose en las reglas CSS
   * Esto permite obtener dimensiones determinísticas sin esperar a que la imagen cargue
   */
  calculateExpectedBlobDimensions(): { width: number; height: number } {
    const vw = Math.max(window.innerWidth, 320); // Evitar 0
    const isMobile = vw < 640;
    
    let width: number;
    
    // Reglas CSS replicadas:
    // Mobile: w-[85vw] max-w-[900px]
    // Desktop (sm+): w-[65vw] max-w-[700px]
    
    if (isMobile) {
      width = Math.min(vw * 0.85, 900);
    } else {
      width = Math.min(vw * 0.65, 700);
    }
    
    // Aspect ratio original: 1536 / 1024 = 1.5
    const aspectRatio = this.ORIGINAL_BLOB_WIDTH / this.ORIGINAL_BLOB_HEIGHT;
    const height = width / aspectRatio;
    
    return { width, height };
  }

  /**
   * Establece las dimensiones iniciales del blob desde el DOM
   * Debe ser llamado desde el componente About después de que el blob se haya renderizado
   */
  setInitialBlobDimensions(width: number, height: number): void {
    // Validar que las dimensiones sean válidas y mayores a 0
    if (width > 0 && height > 0) {
      this.initialBlobDimensions = { width, height };
      console.log('initial dimentions set from DOM:', this.initialBlobDimensions);
    } else {
      // Si vienen dimensiones inválidas, intentar calcularlas determinísticamente
      const calculated = this.calculateExpectedBlobDimensions();
      this.initialBlobDimensions = calculated;
      console.warn('Invalid DOM dimensions received, using calculated fallback:', width, height, '->', calculated);
    }
  }

  /**
   * Calcula la escala óptima del blob para que ocupe el máximo espacio posible
   * sin salirse del viewport (considerando navbar y margen)
   */
  get BLOB_SCALE(): number {
    // Si no se han establecido las dimensiones iniciales, intentar calcularlas
    if (!this.initialBlobDimensions || this.initialBlobDimensions.width <= 0 || this.initialBlobDimensions.height <= 0) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    const navbarHeight = this.getNavbarHeight();
    const availableWidth = Math.max(window.innerWidth - (this.BLOB_MARGIN * 2), 100); // Mínimo 100px
    const availableHeight = Math.max(window.innerHeight - navbarHeight - (this.BLOB_MARGIN * 2), 100); // Mínimo 100px

    const isMobile = window.innerWidth < 640;

    // Usar las dimensiones reales del blob obtenidas del DOM
    const { width: initialBlobWidth, height: initialBlobHeight } = this.initialBlobDimensions;

    // En mobile (rotado 90°), las dimensiones visuales se invierten:
    // - El ANCHO inicial se convierte en ALTURA visual
    // - La ALTURA inicial se convierte en ANCHO visual
    let visualWidth: number;
    let visualHeight: number;

    if (isMobile) {
      // Blob rotado 90°: altura inicial → ancho visual, ancho inicial → altura visual
      visualWidth = initialBlobHeight;
      visualHeight = initialBlobWidth;
    } else {
      // Desktop: sin rotación
      visualWidth = initialBlobWidth;
      visualHeight = initialBlobHeight;
    }

    // Evitar división por cero
    if (visualWidth <= 0 || visualHeight <= 0) return 1.4;

    // Calcular el scale multiplicador necesario para cada dimensión
    const scaleByWidth = availableWidth / visualWidth;
    const scaleByHeight = availableHeight / visualHeight;

    // Usar el menor de los dos para asegurar que cabe en ambas dimensiones
    // con exactamente BLOB_MARGIN px de margen en los lados que tocan
    const scale = Math.min(scaleByWidth, scaleByHeight);
    
    // Validar que el scale sea razonable (no 0, no infinito)
    if (!isFinite(scale) || scale <= 0) return 1.4;
    
    return scale;
  }

  // ==========================================
  // DIMENSIONES ORIGINALES DE LA IMAGEN
  // ==========================================

  /**
   * Ancho original de la imagen del blob (referencia)
   */
  readonly ORIGINAL_BLOB_WIDTH = 1536;

  /**
   * Alto original de la imagen del blob (referencia)
   */
  readonly ORIGINAL_BLOB_HEIGHT = 1024;

  // ==========================================
  // CONFIGURACIÓN DE ROTACIÓN
  // ==========================================

  /**
   * Rotación inicial del blob en desktop
   */
  readonly DESKTOP_INITIAL_ROTATION = 0;

  /**
   * Rotación final del blob en desktop
   */
  readonly DESKTOP_FINAL_ROTATION = 0;

  /**
   * Rotación inicial del blob en mobile
   */
  readonly MOBILE_INITIAL_ROTATION = 90 + 30;

  /**
   * Rotación final del blob en mobile
   */
  readonly MOBILE_FINAL_ROTATION = 90;

  // ==========================================
  // ALTURA DE SCROLL DEL CONTENEDOR
  // ==========================================

  /**
   * Altura total del div de scroll en About
   * Debe ser suficiente para las animaciones 1 y 2
   * Calculado: SEQUENCE_END + margen de seguridad
   */
  get ABOUT_SCROLL_HEIGHT(): number {
    return this.SEQUENCE_END + 100; // Margen de seguridad
  }

  // ==========================================
  // MÉTODOS DE CÁLCULO
  // ==========================================

  /**
   * Calcula el ancho final del blob basado en el viewport
   */
  getFinalBlobWidth(isMobile: boolean): number {
    if (!this.initialBlobDimensions) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    // En mobile rotado 90°, el ancho visual es la altura inicial
    if (isMobile) {
      return this.initialBlobDimensions.height * this.BLOB_SCALE;
    }

    // En desktop, el ancho visual es el ancho inicial
    return this.initialBlobDimensions.width * this.BLOB_SCALE;
  }

  /**
   * Calcula la altura del navbar
   */
  getNavbarHeight(): number {
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

  /**
   * Calcula la altura disponible del viewport (sin navbar)
   */
  getAvailableViewportHeight(): number {
    const navbarHeight = this.getNavbarHeight();
    return window.innerHeight - navbarHeight;
  }

  /**
   * Calcula el centro vertical ajustado (considerando navbar)
   */
  getAdjustedCenterY(): number {
    const navbarHeight = this.getNavbarHeight();
    const availableHeight = this.getAvailableViewportHeight();
    return navbarHeight + (availableHeight / 2);
  }

  /**
   * Calcula el factor de escala para las bubbles basado en las dimensiones originales de la imagen
   * Este scale se usa para escalar las coordenadas y tamaños de las bubbles desde la imagen de referencia (1536×1024)
   *
   * Este método replica la lógica original del componente Skills antes de usar el servicio centralizado
   */
  getBlobScale(isMobile: boolean): number {
    if (!this.initialBlobDimensions) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    // Replicar la lógica original: ancho inicial del blob * BLOB_SCALE / dimensión original
    // En desktop: (initialWidth * BLOB_SCALE) / ORIGINAL_WIDTH
    // En mobile: (initialHeight * BLOB_SCALE) / ORIGINAL_HEIGHT (porque está rotado)
    const { width: initialBlobWidth, height: initialBlobHeight } = this.initialBlobDimensions;

    if (isMobile) {
      // En mobile rotado, el ancho visual es la altura inicial
      const finalBlobWidth = initialBlobHeight * this.BLOB_SCALE;
      return finalBlobWidth / this.ORIGINAL_BLOB_HEIGHT;
    } else {
      // En desktop, el ancho visual es el ancho inicial
      const finalBlobWidth = initialBlobWidth * this.BLOB_SCALE;
      return finalBlobWidth / this.ORIGINAL_BLOB_WIDTH;
    }
  }

  /**
   * Obtiene la rotación inicial según el dispositivo
   */
  getInitialRotation(isMobile: boolean): number {
    return isMobile ? this.MOBILE_INITIAL_ROTATION : this.DESKTOP_INITIAL_ROTATION;
  }

  /**
   * Obtiene la rotación final según el dispositivo
   */
  getFinalRotation(isMobile: boolean): number {
    return isMobile ? this.MOBILE_FINAL_ROTATION : this.DESKTOP_FINAL_ROTATION;
  }

  /**
   * Determina si el dispositivo es mobile basado en el ancho del viewport
   * Centraliza el breakpoint de 640px que se usa en toda la aplicación
   */
  isMobile(): boolean {
    return window.innerWidth < 640;
  }

  /**
   * Calcula las posiciones y dimensiones comunes para las animaciones de Skills
   * Este método centraliza todos los cálculos que se repiten en Phase 1, 2 y 3
   *
   * Retorna un objeto con todas las propiedades necesarias para posicionar:
   * - El título "Skills"
   * - Las bubbles en sus diferentes fases de animación
   */
  getSkillsLayoutConfig(isMobile: boolean): {
    navbarHeight: number;
    titleHeight: number;
    titleMargin: number;
    titleFinalY: number;
    availableHeight: number;
    bubblesAreaHeight: number;
    totalContentHeight: number;
    verticalOffset: number;
    bubblesTopY: number;
  } {
    const navbarHeight = this.getNavbarHeight();
    const titleMargin = 10;
    const availableHeight = window.innerHeight - navbarHeight;
    
    // Calcular altura del título según breakpoints de Tailwind
    let titleHeight = 150; // lg (>= 1024px)
    const width = window.innerWidth;
    
    if (width < 640) { // < sm
      titleHeight = 80;
    } else if (width < 768) { // sm (>= 640px)
      titleHeight = 130;
    } else if (width < 1024) { // md (>= 768px)
      titleHeight = 140;
    }

    // Posición final del título: navbar bottom + 10px
    // La posición Y es relativa al centro del viewport (por el flex items-center)
    // Necesitamos posicionar el CENTRO del título, no el top
    const titleFinalY = -(window.innerHeight / 2) + navbarHeight + titleMargin + (titleHeight / 2);

    // Desktop: centrar grupo de bubbles verticalmente
    // Mobile: distribuir bubbles verticalmente en el espacio
    const bubblesAreaHeight = isMobile ? availableHeight * 0.6 : 300;
    const totalContentHeight = titleHeight + bubblesAreaHeight + 40; // 40px de spacing

    // Calcular posición inicial de bubbles para centrar todo
    const verticalOffset = Math.max(0, (availableHeight - totalContentHeight) / 2);
    const bubblesTopY = navbarHeight + titleMargin + titleHeight + 40 + verticalOffset;

    return {
      navbarHeight,
      titleHeight,
      titleMargin,
      titleFinalY,
      availableHeight,
      bubblesAreaHeight,
      totalContentHeight,
      verticalOffset,
      bubblesTopY,
    };
  }
}
