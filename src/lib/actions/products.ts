"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, orderItems, productImages, products } from "@/db/schema";
import { assertSeller } from "@/lib/dal";
import { FormState, ProductFormSchema } from "@/lib/definitions";
import { slugify } from "@/lib/format";

function parseProductForm(formData: FormData) {
  return ProductFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    highlights: formData.get("highlights") ?? "",
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    compareAt: formData.get("compareAt") ?? "",
    stock: formData.get("stock"),
    status: formData.get("status"),
    images: formData.getAll("images").map(String).filter(Boolean),
  });
}

async function assertLeafCategory(categoryId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.parentId, categoryId));
  const exists = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
    columns: { id: true },
  });
  return Boolean(exists) && row.n === 0;
}

export async function createProduct(_state: FormState, formData: FormData): Promise<FormState> {
  const { store } = await assertSeller();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { images, price, compareAt, ...data } = parsed.data;

  if (!(await assertLeafCategory(data.categoryId))) {
    return { errors: { categoryId: ["Pick a specific sub-category."] } };
  }

  const id = crypto.randomUUID();
  await db.batch([
    db.insert(products).values({
      ...data,
      id,
      storeId: store.id,
      priceCents: price,
      compareAtCents: compareAt,
      slug: `${slugify(data.title)}-${id.slice(0, 6)}`,
    }),
    db.insert(productImages).values(images.map((url, position) => ({ productId: id, url, position }))),
  ]);

  revalidatePath("/seller/products");
  redirect("/seller/products?created=1");
}

export async function updateProduct(
  productId: string,
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const { store } = await assertSeller();

  // Ownership check: the WHERE includes store_id, so a seller can't edit
  // another store's product even by calling this action directly.
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.storeId, store.id)),
    columns: { id: true, slug: true, status: true },
  });
  if (!product) return { message: "Product not found." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { images, price, compareAt, status, ...data } = parsed.data;

  if (!(await assertLeafCategory(data.categoryId))) {
    return { errors: { categoryId: ["Pick a specific sub-category."] } };
  }

  await db.batch([
    db
      .update(products)
      .set({
        ...data,
        priceCents: price,
        compareAtCents: compareAt,
        // A blocked product stays blocked until an admin lifts it.
        status: product.status === "blocked" ? "blocked" : status,
      })
      .where(and(eq(products.id, productId), eq(products.storeId, store.id))),
    db.delete(productImages).where(eq(productImages.productId, productId)),
    db.insert(productImages).values(images.map((url, position) => ({ productId, url, position }))),
  ]);

  revalidatePath("/seller/products");
  revalidatePath(`/product/${product.slug}`);
  return { ok: true, message: "Product saved." };
}

export async function setProductPublished(productId: string, published: boolean) {
  const { store } = await assertSeller();
  await db
    .update(products)
    .set({ status: published ? "active" : "draft" })
    .where(
      and(
        eq(products.id, productId),
        eq(products.storeId, store.id),
        // Sellers can't un-block a product an admin blocked.
        eq(products.status, published ? "draft" : "active")
      )
    );
  revalidatePath("/seller/products");
}

export async function deleteProduct(productId: string) {
  const { store } = await assertSeller();

  // Products that were ever ordered are kept (order history references them);
  // they're unpublished instead.
  const [{ n }] = await db
    .select({ n: count() })
    .from(orderItems)
    .where(eq(orderItems.productId, productId));

  if (n > 0) {
    await db
      .update(products)
      .set({ status: "draft" })
      .where(and(eq(products.id, productId), eq(products.storeId, store.id), eq(products.status, "active")));
  } else {
    await db.delete(products).where(and(eq(products.id, productId), eq(products.storeId, store.id)));
  }
  revalidatePath("/seller/products");
}
