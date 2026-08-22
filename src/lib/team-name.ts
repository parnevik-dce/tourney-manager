export function teamDisplayName(
  name: string | null | undefined,
  associationName: string,
  divisionName?: string | null,
): string {
  if (name && name.trim()) return name;
  return divisionName ? `${associationName} ${divisionName}` : associationName;
}
