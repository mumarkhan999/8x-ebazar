import * as z from "zod";
import { isPublicImageUrl } from "@/lib/images";

// Generic shape returned by form server actions (used with useActionState).
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      ok?: boolean;
    }
  | undefined;

export const SignupFormSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters." }),
  email: z.email({ message: "Enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { message: "Password must contain a letter." })
    .regex(/[0-9]/, { message: "Password must contain a number." }),
});

export const LoginFormSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }).trim(),
  password: z.string().min(1, { message: "Password is required." }),
});

const imageUrl = z
  .string()
  .trim()
  .refine(isPublicImageUrl, { message: "Must be a public https:// image URL." });

const optionalImageUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || isPublicImageUrl(v), {
    message: "Must be a public https:// image URL.",
  });

export const StoreFormSchema = z.object({
  name: z.string().trim().min(3, { message: "Store name must be at least 3 characters." }).max(60),
  tagline: z.string().trim().max(120, { message: "Keep the tagline under 120 characters." }),
  description: z.string().trim().max(2000),
  logoUrl: optionalImageUrl,
  bannerUrl: optionalImageUrl,
});

const money = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number.` })
    .positive({ message: `${label} must be greater than 0.` })
    .max(100000, { message: `${label} is too high.` })
    .transform((v) => Math.round(v * 100));

export const ProductFormSchema = z
  .object({
    title: z.string().trim().min(5, { message: "Title must be at least 5 characters." }).max(160),
    description: z.string().trim().min(20, { message: "Description must be at least 20 characters." }).max(5000),
    highlights: z
      .string()
      .transform((v) =>
        v
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 8)
      ),
    categoryId: z.uuid({ message: "Pick a category." }),
    price: money("Price"),
    compareAt: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : Math.round(Number(v) * 100)))
      .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
        message: "Original price must be a number.",
      }),
    stock: z.coerce
      .number({ message: "Stock must be a number." })
      .int({ message: "Stock must be a whole number." })
      .min(0, { message: "Stock can't be negative." })
      .max(100000),
    status: z.enum(["draft", "active"]),
    images: z
      .array(imageUrl)
      .min(1, { message: "Add at least one image." })
      .max(8, { message: "Up to 8 images." }),
  })
  .refine((d) => d.compareAt === null || d.compareAt > d.price, {
    path: ["compareAt"],
    message: "Original price must be higher than the selling price.",
  });

export const ReviewFormSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1, { message: "Pick a rating." }).max(5),
  body: z.string().trim().min(10, { message: "Write at least 10 characters." }).max(2000),
});

export const CategoryFormSchema = z.object({
  name: z.string().trim().min(2).max(60),
  parentId: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.uuid().nullable()),
  imageUrl: optionalImageUrl,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const ShippingSchema = z.object({
  shippingName: z.string().trim().min(2, { message: "Enter the recipient's name." }).max(100),
  shippingPhone: z.string().trim().min(7, { message: "Enter a phone number." }).max(20),
  shippingAddress: z.object({
    line1: z.string().trim().min(5, { message: "Enter a street address." }).max(200),
    city: z.string().trim().min(2, { message: "Enter a city." }).max(80),
    region: z.string().trim().min(2, { message: "Enter a province/state." }).max(80),
    postalCode: z.string().trim().min(3, { message: "Enter a postal code." }).max(12),
  }),
});

export const CheckoutSchema = ShippingSchema.extend({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, { message: "Your cart is empty." })
    .max(50),
});
