export const utf8Encode = (text: string): string => {
  try {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    return Array.from(encoded)
      .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
  } catch (error) {
    throw new Error("Failed to encode UTF-8");
  }
};

export const utf8Decode = (text: string): string => {
  try {
    const bytes = text
      .split(" ")
      .map((hex) => parseInt(hex.trim(), 16))
      .filter((b) => !isNaN(b));
    const decoder = new TextDecoder("utf-8");
    const decoded = decoder.decode(new Uint8Array(bytes));
    return decoded;
  } catch (error) {
    throw new Error("Failed to decode UTF-8");
  }
};

export const base64Encode = (text: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    throw new Error("Failed to encode Base64");
  }
};

export const base64Decode = (text: string): string => {
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch (error) {
    throw new Error("Failed to decode Base64");
  }
};

export const formatJson = (text: string): string => {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
};
