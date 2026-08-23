export function teamDisplayName(
  name: string | null | undefined,
  associationName: string,
  divisionName?: string | null,
): string {
  if (name && name.trim()) return name;
  return divisionName ? `${associationName} ${divisionName}` : associationName;
}

export function teamAssociationLabel(
  name: string | null | undefined,
  associationName: string,
): string {
  return name && name.trim() ? `${associationName} ${name}` : associationName;
}

/**
 * Like teamAssociationLabel, but disambiguates unnamed teams by division
 * instead of collapsing to the bare association name. Two teams from the
 * same association with no custom name (e.g. different divisions) would
 * otherwise produce identical labels — this keeps every team's label
 * unique, which matters for CSV-based team matching (see roster bulk
 * import).
 */
export function teamImportLabel(
  name: string | null | undefined,
  associationName: string,
  divisionName?: string | null,
): string {
  const suffix = name && name.trim() ? name : divisionName;
  return suffix ? `${associationName} ${suffix}` : associationName;
}
