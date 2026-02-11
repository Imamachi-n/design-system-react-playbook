import type { ComponentPropsWithRef, ReactNode } from "react";
import { button } from "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ComponentPropsWithRef<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", children, ...props }: ButtonProps) {
  return (
    <button className={button({ variant, size })} {...props}>
      {children}
    </button>
  );
}
