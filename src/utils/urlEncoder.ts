export function encodeURL(input: string): string {
  try {
    return encodeURIComponent(input).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  } catch (error) {
    throw new Error("Failed to encode URL. Please check your input.");
  }
}

export function decodeURL(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/g, " "));
  } catch (error) {
    throw new Error(
      "Failed to decode URL. The input may contain invalid encoded characters.",
    );
  }
}
