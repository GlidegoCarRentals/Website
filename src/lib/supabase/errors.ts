export function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;

  const message = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === '42P01' ||
    error.code === '42703' ||
    message.includes('schema cache') ||
    message.includes('could not find the') ||
    message.includes('relation') ||
    message.includes('column')
  );
}
