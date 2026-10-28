/**
 * Drop keys whose value is undefined.
 * Reason: a DTO class (target ES2022+) always has every property; a field that was not sent
 * is undefined. Object.assign(entity, dto) would then overwrite existing data with undefined.
 */
export function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
