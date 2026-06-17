/**
 * Memvalidasi apakah string sesuai format UUID v4.
 * Berguna untuk mencegah Prisma error (invalid input syntax for type uuid).
 */
export const isValidUUID = (uuid: string): boolean => {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof uuid === 'string' && uuidRegex.test(uuid);
};
