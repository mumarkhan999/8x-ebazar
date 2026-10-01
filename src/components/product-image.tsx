import Image from "next/image";
import { imageSrc, PLACEHOLDER_IMAGE } from "@/lib/images";

/**
 * Wraps next/image with `unoptimized`: images come from Cloudinary (resized
 * by Cloudinary via imageSrc) or arbitrary public URLs, so we skip Vercel's
 * optimizer rather than allow-listing every host on the internet.
 */
export function ProductImage({
  src,
  alt,
  width = 600,
  className = "object-cover",
  priority = false,
  sizes,
}: {
  src: string | null | undefined;
  alt: string;
  width?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={src ? imageSrc(src, width) : PLACEHOLDER_IMAGE}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      sizes={sizes ?? `${width}px`}
      className={className}
    />
  );
}
