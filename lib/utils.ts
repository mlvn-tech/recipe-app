export const formatTitle = (title?: string) => {
  if (!title) return "";

  return title.charAt(0).toUpperCase() + title.slice(1);
};