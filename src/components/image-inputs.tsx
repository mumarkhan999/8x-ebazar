"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { isPublicImageUrl } from "@/lib/images";

const MAX_BYTES = 5 * 1024 * 1024;

// Browser -> Cloudinary direct upload. Our server only signs the request.
async function uploadToCloudinary(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 5 MB or smaller.");

  const signRes = await fetch("/api/uploads/sign", { method: "POST" });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error ?? "Upload isn't available right now.");

  const body = new FormData();
  body.append("file", file);
  for (const [k, v] of Object.entries(sign.fields as Record<string, string>)) body.append(k, v);

  const res = await fetch(sign.uploadUrl, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed.");
  return data.secure_url as string;
}

function useUploader(onUploaded: (url: string) => void) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      for (const file of Array.from(files)) onUploaded(await uploadToCloudinary(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return { fileRef, busy, error, setError, onFiles };
}

/**
 * Multiple product images. Each URL is submitted as a repeated `images` field;
 * the first one is the cover. Images come from a Cloudinary upload or any
 * public https URL pasted in.
 */
export function ImageListInput({
  name = "images",
  defaultValue = [],
  max = 8,
  error: serverError,
}: {
  name?: string;
  defaultValue?: string[];
  max?: number;
  error?: string[];
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const { fileRef, busy, error, setError, onFiles } = useUploader((url) =>
    setUrls((u) => (u.length < max ? [...u, url] : u))
  );

  function addDraft() {
    const value = draft.trim();
    if (!isPublicImageUrl(value)) {
      setError("Paste a public image link starting with https://");
      return;
    }
    setError(null);
    setUrls((u) => (u.length < max ? [...u, value] : u));
    setDraft("");
  }

  const move = (i: number, dir: -1 | 1) =>
    setUrls((u) => {
      const next = [...u];
      const j = i + dir;
      if (j < 0 || j >= next.length) return u;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
            <ProductImage src={url} alt={`Image ${i + 1}`} width={300} />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <div className="flex gap-1">
                <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>←</IconBtn>
                <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === urls.length - 1}>→</IconBtn>
              </div>
              <IconBtn label="Remove image" onClick={() => setUrls((u) => u.filter((x) => x !== url))}>✕</IconBtn>
            </div>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line-strong text-xs font-semibold text-muted transition hover:border-jade-500 hover:text-jade-700"
          >
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <span className="text-center">
                <span className="block text-2xl leading-none">+</span>Upload
              </span>
            )}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />

      {urls.length < max && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="…or paste an image URL (https://images.unsplash.com/…)"
            className="input"
            aria-label="Image URL"
          />
          <button type="button" onClick={addDraft} className="btn btn-outline">Add</button>
        </div>
      )}
      <p className="text-xs text-muted">Up to {max} images. The first is the cover — use the arrows to reorder.</p>
      {(error || serverError?.length) && <p className="text-xs font-medium text-rose-600">{error ?? serverError?.[0]}</p>}
    </div>
  );
}

/** A single optional image (store logo / banner / category tile). */
export function SingleImageInput({
  name,
  label,
  defaultValue,
  aspect = "aspect-square w-24",
  error: serverError,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  aspect?: string;
  error?: string[];
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const { fileRef, busy, error, onFiles } = useUploader(setUrl);

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`relative shrink-0 overflow-hidden rounded-xl border border-line bg-paper ${aspect}`}>
          {url && isPublicImageUrl(url) ? (
            <ProductImage src={url} alt="" width={600} />
          ) : (
            <span className="grid h-full w-full place-items-center text-[11px] text-muted">No image</span>
          )}
        </div>
        <div className="min-w-56 flex-1 space-y-2">
          <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="input" aria-label={`${label} URL`} />
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn btn-outline btn-sm">
              {busy ? "Uploading…" : "Upload image"}
            </button>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="btn btn-ghost btn-sm">Remove</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
      </div>
      {(error || serverError?.length) && <p className="mt-1.5 text-xs font-medium text-rose-600">{error ?? serverError?.[0]}</p>}
    </div>
  );
}

function IconBtn({ label, children, ...rest }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className="grid h-6 w-6 place-items-center rounded-md bg-white/90 text-xs font-bold text-ink disabled:opacity-30" {...rest}>
      {children}
    </button>
  );
}
