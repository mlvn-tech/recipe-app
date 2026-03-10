import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  overflow?: boolean;
  view?: "list" | "grid";
};

export default function Card({
  children,
  className = "",
  overflow = false,
  view = "list",
}: CardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-3xl
        border border-gray-200
        ${overflow ? "overflow-hidden p-0" : "p-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
