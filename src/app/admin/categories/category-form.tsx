"use client";

import { useActionState } from "react";
import { createCategory } from "@/lib/actions/admin";
import { FieldError, FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function CategoryForm({ departments }: { departments: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createCategory, undefined);
  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="font-extrabold">Add a category</h2>
      <div>
        <label htmlFor="cat-name" className="label">Name</label>
        <input id="cat-name" name="name" required className="input" />
        <FieldError errors={state?.errors?.name} />
      </div>
      <div>
        <label htmlFor="cat-parent" className="label">Department</label>
        <select id="cat-parent" name="parentId" defaultValue="" className="input">
          <option value="">— New top-level department —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <FieldError errors={state?.errors?.parentId} />
      </div>
      <div>
        <label htmlFor="cat-image" className="label">Tile image URL <span className="font-normal text-muted">(optional)</span></label>
        <input id="cat-image" name="imageUrl" placeholder="https://…" className="input" />
        <FieldError errors={state?.errors?.imageUrl} />
      </div>
      <div>
        <label htmlFor="cat-sort" className="label">Sort order</label>
        <input id="cat-sort" name="sortOrder" type="number" min={0} defaultValue={0} className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Adding…">Add category</SubmitButton>
    </form>
  );
}
