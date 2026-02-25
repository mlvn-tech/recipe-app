export const styles = {
  button: {
    primary: "bg-[var(--color-accent)] text-white px-8 py-4 rounded-full font-semibold active:scale-95 transition",
    secondary: "bg-white border border-gray-200 text-gray-600 px-8 py-4 rounded-xl text-sm active:scale-95 transition",
    ghost: "text-gray-400 hover:text-gray-600 transition",
    danger: "text-gray-300 hover:text-red-400 transition",
    floating: "bg-white border border-gray-200 shadow-md rounded-full active:scale-95 transition",
    floatingFrosted: "floating-blur flex items-center gap-2 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full text-sm font-semibold text-gray-500 whitespace-nowrap active:scale-95 transition",
    save: "bg-[var(--color-accent)]/80 border border-[var(--color-accent)]/80 text-white px-8 py-4 rounded-full shadow-lg text-md font-semibold active:scale-95 transition",
    delete: "w-full border-2 border-red-300 bg-red-50 text-red-500 py-4 rounded-full text-md font-semibold",

  },

  input: {
    default: "w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:outline-none focus:border-gray-300 text-sm",
    inline: "bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none text-sm",
  },

  dropdown: {
  trigger: `
    w-full
    bg-gray-50
    border border-gray-200
    rounded-xl
    px-4 py-3
    text-sm
    flex items-center justify-between
    cursor-pointer
    focus:outline-none
    focus:border-gray-300
    transition
  `,
  item: `
    w-full
    text-left
    px-4
    py-3
    text-sm
    hover:bg-gray-50
    transition
  `,
  container: `
    absolute
    left-0
    right-0
    top-full
    mt-2
    bg-white
    rounded-xl
    shadow-lg
    z-50
    overflow-hidden
    transition-all
    duration-200
    ease-out
    origin-top
  `,
  containerOpen: `max-h-96 opacity-100`,
  containerClosed: `max-h-0 opacity-0 pointer-events-none shadow-none mt-0`,
}

} as const;
