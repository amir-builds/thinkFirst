export function compareOutput(expected, actual) {
  const normalize = (str) => {
    return String(str)
      .trim()
      .replace(/\s+/g, " ")  // Multiple spaces to single space
      .replace(/\[\s+/g, "[") // Remove space after [
      .replace(/\s+\]/g, "]") // Remove space before ]
      .replace(/,\s+/g, ",")  // Remove space after comma
      .replace(/\s+,/g, ","); // Remove space before comma
  };
  return normalize(expected) === normalize(actual);
}
