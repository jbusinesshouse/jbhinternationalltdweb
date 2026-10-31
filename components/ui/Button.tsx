import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variants = {
  /** Orange fill carries dark ink (white on this orange is only 2.6:1). */
  primary: "bg-primary text-primary-ink hover:bg-primary-dark",
  secondary: "bg-navy text-white hover:bg-navy-dark",
  outline: "border-[1.5px] border-[#D1D5DB] bg-white text-foreground hover:border-primary",
  ghost: "text-foreground hover:bg-surface",
  danger: "bg-[#B42318] text-white hover:bg-[#912018]",
};

const sizes = {
  sm: "h-10 px-4 text-sm font-bold",
  md: "h-11 px-6 text-[15px] font-bold",
  lg: "h-[52px] px-8 text-base font-bold",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
