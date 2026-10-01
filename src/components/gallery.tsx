"use client";

import { useState } from "react";
import { ProductImage } from "@/components/product-image";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [""];

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {list.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-paper ring-2 transition ${
                i === active ? "ring-jade-500" : "ring-transparent hover:ring-line-strong"
              }`}
            >
              <ProductImage src={src} alt="" width={160} />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-paper">
        <ProductImage src={list[active]} alt={alt} width={1000} priority sizes="(min-width: 1024px) 480px, 100vw" />
      </div>
    </div>
  );
}
