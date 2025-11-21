import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class BlobAnimationConfigService {
  get CENTERING_START_OFFSET(): number {
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      const aspectRatio = window.innerHeight / window.innerWidth;

      return aspectRatio <= 1.8 ? 80 : 0;
    }

    return 100;
  }
  readonly CENTERING_DURATION = 800;
  get CENTERING_END(): number {
    return this.CENTERING_START_OFFSET + this.CENTERING_DURATION;
  }
  readonly TOTAL_IMAGES = 25;
  readonly PIXELS_PER_IMAGE = 50;
  get SEQUENCE_DURATION(): number {
    return this.TOTAL_IMAGES * this.PIXELS_PER_IMAGE;
  }
  get SEQUENCE_END(): number {
    return this.CENTERING_END + this.SEQUENCE_DURATION;
  }
  readonly BLOB_MARGIN = 10;
  private initialBlobDimensions: { width: number; height: number } | null = null;
  calculateExpectedBlobDimensions(): { width: number; height: number } {
    const vw = Math.max(window.innerWidth, 320);
    const isMobile = vw < 640;

    let width: number;

    if (isMobile) {
      width = Math.min(vw * 0.85, 900);
    } else {
      width = Math.min(vw * 0.65, 700);
    }

    const aspectRatio = this.ORIGINAL_BLOB_WIDTH / this.ORIGINAL_BLOB_HEIGHT;
    const height = width / aspectRatio;

    return { width, height };
  }
  setInitialBlobDimensions(width: number, height: number): void {
    if (width > 0 && height > 0) {
      this.initialBlobDimensions = { width, height };
      console.log('initial dimentions set from DOM:', this.initialBlobDimensions);
    } else {
      const calculated = this.calculateExpectedBlobDimensions();
      this.initialBlobDimensions = calculated;
      console.warn(
        'Invalid DOM dimensions received, using calculated fallback:',
        width,
        height,
        '->',
        calculated
      );
    }
  }
  get BLOB_SCALE(): number {
    if (
      !this.initialBlobDimensions ||
      this.initialBlobDimensions.width <= 0 ||
      this.initialBlobDimensions.height <= 0
    ) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    const navbarHeight = this.getNavbarHeight();
    const availableWidth = Math.max(window.innerWidth - this.BLOB_MARGIN * 2, 100);
    const availableHeight = Math.max(window.innerHeight - navbarHeight - this.BLOB_MARGIN * 2, 100);

    const isMobile = window.innerWidth < 640;

    const { width: initialBlobWidth, height: initialBlobHeight } = this.initialBlobDimensions;

    let visualWidth: number;
    let visualHeight: number;

    if (isMobile) {
      visualWidth = initialBlobHeight;
      visualHeight = initialBlobWidth;
    } else {
      visualWidth = initialBlobWidth;
      visualHeight = initialBlobHeight;
    }

    if (visualWidth <= 0 || visualHeight <= 0) return 1.4;

    const scaleByWidth = availableWidth / visualWidth;
    const scaleByHeight = availableHeight / visualHeight;

    const scale = Math.min(scaleByWidth, scaleByHeight);

    if (!isFinite(scale) || scale <= 0) return 1.4;

    return scale;
  }
  readonly ORIGINAL_BLOB_WIDTH = 1536;
  readonly ORIGINAL_BLOB_HEIGHT = 1024;
  readonly DESKTOP_INITIAL_ROTATION = 0;
  readonly DESKTOP_FINAL_ROTATION = 0;
  readonly MOBILE_INITIAL_ROTATION = 90 + 30;
  readonly MOBILE_FINAL_ROTATION = 90;
  get ABOUT_SCROLL_HEIGHT(): number {
    return this.SEQUENCE_END + 100;
  }
  getFinalBlobWidth(isMobile: boolean): number {
    if (!this.initialBlobDimensions) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    if (isMobile) {
      return this.initialBlobDimensions.height * this.BLOB_SCALE;
    }

    return this.initialBlobDimensions.width * this.BLOB_SCALE;
  }
  getNavbarHeight(): number {
    const navbar = document.querySelector('app-navbar');
    if (navbar) {
      return navbar.getBoundingClientRect().height;
    }
    const isMd = window.innerWidth >= 768;
    const isSm = window.innerWidth >= 640;
    const navbarInnerHeight = isMd ? 76 : isSm ? 72 : 68;
    const paddingY = 12;
    return navbarInnerHeight + paddingY * 2;
  }
  getAvailableViewportHeight(): number {
    const navbarHeight = this.getNavbarHeight();
    return window.innerHeight - navbarHeight;
  }
  getAdjustedCenterY(): number {
    const navbarHeight = this.getNavbarHeight();
    const availableHeight = this.getAvailableViewportHeight();
    return navbarHeight + availableHeight / 2;
  }
  getBlobScale(isMobile: boolean): number {
    if (!this.initialBlobDimensions) {
      this.initialBlobDimensions = this.calculateExpectedBlobDimensions();
    }

    const { width: initialBlobWidth, height: initialBlobHeight } = this.initialBlobDimensions;

    if (isMobile) {
      const finalBlobWidth = initialBlobHeight * this.BLOB_SCALE;
      return finalBlobWidth / this.ORIGINAL_BLOB_HEIGHT;
    } else {
      const finalBlobWidth = initialBlobWidth * this.BLOB_SCALE;
      return finalBlobWidth / this.ORIGINAL_BLOB_WIDTH;
    }
  }
  getInitialRotation(isMobile: boolean): number {
    return isMobile ? this.MOBILE_INITIAL_ROTATION : this.DESKTOP_INITIAL_ROTATION;
  }
  getFinalRotation(isMobile: boolean): number {
    return isMobile ? this.MOBILE_FINAL_ROTATION : this.DESKTOP_FINAL_ROTATION;
  }
  isMobile(): boolean {
    return window.innerWidth < 640;
  }
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

    let titleHeight = 150;
    const width = window.innerWidth;

    if (width < 640) {
      titleHeight = 80;
    } else if (width < 768) {
      titleHeight = 130;
    } else if (width < 1024) {
      titleHeight = 140;
    }

    const titleFinalY = -(window.innerHeight / 2) + navbarHeight + titleMargin + titleHeight / 2;

    const bubblesAreaHeight = isMobile ? availableHeight * 0.6 : 300;
    const totalContentHeight = titleHeight + bubblesAreaHeight + 40;

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
