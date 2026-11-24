// Turns a picked image file into a small square JPEG data URL (center-cropped),
// so profile pictures stay around 20-40 KB no matter how big the original was.
export function resizeImageToDataUrl(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type)) {
      reject(new Error('Choose a JPG, PNG or WebP picture.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('That picture is larger than 10 MB. Choose a smaller one.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as a picture.'));
    };
    img.src = url;
  });
}
