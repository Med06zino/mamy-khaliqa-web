import type { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const cls = (v: Variant, extra = "") => `btn btn-${v} ${extra}`.trim();

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cls(variant, className)} {...p} />;
}
export function ButtonLink({ variant = "primary", className, ...p }: LinkProps & { variant?: Variant }) {
  return <Link className={cls(variant, className)} {...p} />;
}
