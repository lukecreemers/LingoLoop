export function activeFilter(isActive?: boolean) {
  if (isActive === true) return null;
  if (isActive === false) return { not: null };
  return undefined;
}
