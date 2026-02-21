import { ComponentType } from "react";

type IconProps = {
  icon: ComponentType<any>;
  size?: number;
  className?: string;
};

export default function Icon({
  icon: IconComponent,
  size = 24, // 🔹 standaard grootte
  className = "",
}: IconProps) {
  return (
    <IconComponent
      strokeWidth={2} // 🔹 standaard dikker
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
