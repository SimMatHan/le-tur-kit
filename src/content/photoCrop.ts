// Beskæring af uploadede fotos til rammens portrætformat (4.6:6) og
// nedskalering til maks. 1200 px på den længste led.
export const PHOTO_ASPECT = 4.6 / 6;
export const PHOTO_MAX_SIDE = 1200;

export interface Rect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
}

/** Centreret beskæring til aspect (bredde/højde) og nedskalering til maxSide. Ren funktion. */
export function cropRect(srcW: number, srcH: number, aspect = PHOTO_ASPECT, maxSide = PHOTO_MAX_SIDE): Rect {
  let sw = srcW;
  let sh = srcW / aspect;
  if (sh > srcH) {
    sh = srcH;
    sw = srcH * aspect;
  }
  // Portrætbilleder beskæres lidt over midten, så hovedet ikke ryger.
  const sx = (srcW - sw) / 2;
  const sy = Math.max(0, Math.min(srcH - sh, (srcH - sh) * 0.35));
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
    dw: Math.max(1, Math.round(sw * scale)),
    dh: Math.max(1, Math.round(sh * scale)),
  };
}

async function decode(file: Blob): Promise<{ img: CanvasImageSource; w: number; h: number; close?: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { img: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* fald tilbage til <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Beskær og nedskalér et foto. Returnerer en JPEG-blob. */
export async function cropPhoto(file: Blob): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Filen er ikke et billede');
  const { img, w, h, close } = await decode(file);
  const r = cropRect(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = r.dw;
  canvas.height = r.dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas understøttes ikke');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, r.dw, r.dh);
  close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Kunne ikke gemme billedet'))), 'image/jpeg', 0.88),
  );
}
