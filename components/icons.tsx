import { ComponentType } from "react";

type IconProps = {
  icon: ComponentType<any>;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function Icon({
  icon: IconComponent,
  size = 24, // 🔹 standaard grootte
  className = "",
  strokeWidth = 2,
}: IconProps) {
  return (
    <IconComponent
      strokeWidth={strokeWidth}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
