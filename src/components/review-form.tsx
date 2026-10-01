"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/lib/actions/reviews";
import { FieldError, FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ReviewForm({
  productId,
  existing,
}: {
  productId: string;
  existing?: { rating: number; body: string };
}) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);

  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <p className="font-bold">{existing ? "Update your review" : "Review this product"}</p>
        <p className="text-xs text-muted">You bought this — tell other shoppers what you think.</p>
      </div>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5"
          >
            <svg viewBox="0 0 20 20" className={`h-7 w-7 transition ${(hover || rating) >= n ? "text-saffron-400" : "text-line-strong"}`} fill="currentColor">
              <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8L10 1.8z" />
            </svg>
          </button>
        ))}
      </div>
      <FieldError errors={state?.errors?.rating} />
      <div>
        <label htmlFor="review-body" className="label">Your review</label>
        <textarea id="review-body" name="body" rows={4} defaultValue={existing?.body} className="input" placeholder="What did you like or dislike? How are you using it?" />
        <FieldError errors={state?.errors?.body} />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Posting…">{existing ? "Update review" : "Post review"}</SubmitButton>
    </form>
  );
}
