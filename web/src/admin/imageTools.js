// Shrinks big photos before they are uploaded. A phone camera makes 4–12 MB files (the upload limit is 5 MB, and a
// shop page never needs more than ~1600px); small files are left exactly as they are.

export const MAX_EDGE = 1600;
const KEEP_BELOW = 2.5 * 1024 * 1024; // files already within the edge limit and under this size are untouched

const canEncodeWebp = () => {
  try { return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'); } catch { return false; }
};

/** Resolves to the file to upload: a smaller copy when that helps, otherwise the original. Never throws. */
export async function prepareImage(file, { maxEdge = MAX_EDGE, quality = 0.86 } = {}) {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file; // GIF keeps its frames; HEIC can't be decoded everywhere
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= KEEP_BELOW) { bmp.close?.(); return file; }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext('2d');
    if (file.type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();

    // JPEG stays JPEG; PNG/WebP may have transparent backgrounds (cut-out product shots), so they become WebP.
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : (canEncodeWebp() ? 'image/webp' : file.type);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.type !== type || blob.size >= file.size) return file; // never make it bigger
    const ext = type === 'image/jpeg' ? 'jpg' : 'webp';
    return new File([blob], `${String(file.name || 'photo').replace(/\.[^.]+$/, '')}.${ext}`, { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}
