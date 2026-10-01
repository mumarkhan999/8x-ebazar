// Images are never stored on our server: they're either Cloudinary uploads or
// any public https URL a seller pastes. We don't run them through Vercel's
// image optimizer (that would need a wildcard remotePatterns and turn our
// deployment into an open image proxy). Cloudinary URLs are resized by
// Cloudinary itself via a URL transformation instead.

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export function imageSrc(url: string, width: number) {
  const match = url.match(CLOUDINARY_UPLOAD);
  if (match) {
    return `${match[1]}c_limit,w_${width},f_auto,q_auto/${match[2]}`;
  }
  return url;
}

export function isPublicImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4" fill="#ece7dd"/></svg>`
  );
