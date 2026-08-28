import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary:
    "bg-black text-white hover:bg-gray-800",
  outline:
    "border-2 border-primary text-primary hover:bg-primary/5",
  ghost: "text-foreground hover:bg-surface",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm font-semibold",
  lg: "px-8 py-3.5 text-base font-semibold",
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
  const classes = `inline-flex items-center justify-center rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
