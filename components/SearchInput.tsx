import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Icon from "@/components/icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Zoeken...",
}: Props) {
  return (
    <div className="relative group w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-full
          bg-gray-100
          p-3
          pl-5
          pr-10
          text-sm
          text-gray-800
          placeholder:text-gray-400
          border
          border-gray-100
          focus:border
          focus:border-gray-100 focus:outline-none
          focus:bg-gray-50
          transition
        "
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon
          icon={MagnifyingGlassIcon}
          size={24}
          className="text-gray-400 transition-colors duration-200 group-focus-within:text-gray-500"
        />
      </div>
    </div>
  );
}
