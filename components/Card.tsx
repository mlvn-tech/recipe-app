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
        ${overflow ? "overflow-hidden p-0" : "p-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
