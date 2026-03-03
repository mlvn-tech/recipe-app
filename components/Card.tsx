import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  overflow?: boolean;
};

export default function Card({
  children,
  className = "",
  overflow = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-sm
        active:scale-[0.98] transition-transform duration-150
        ${overflow ? "overflow-hidden p-0" : "p-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
