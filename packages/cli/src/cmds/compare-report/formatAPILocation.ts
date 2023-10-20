export default function formatAPILocation(input: string): string {
  if (input.startsWith('paths.')) {
    const parts = input.split('.');

    // Check if the input only has the 'paths.' and endpoint
    if (parts.length === 2) {
      return parts[1];
    }

    const statusCode = parts[parts.length - 1];
    const method = parts[parts.length - 3].toUpperCase();
    const path = parts[1];

    return `${statusCode} ${method} ${path}`;
  }
  return input;
}
