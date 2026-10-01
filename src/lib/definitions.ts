import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
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

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
