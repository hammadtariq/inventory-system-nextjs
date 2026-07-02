export const comaSeparatedValues = (value) => {
  const numberValue = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(numberValue)) {
    return value;
  }

  // Group digits on the absolute value, then reapply the sign — otherwise the
  // "-" ends up inside integerPart.slice(0, -3) and gets treated as a leading
  // digit group, producing "-,139.95" instead of "-139.95" for any negative
  // number whose integer part is exactly 3 digits.
  const isNegative = numberValue < 0;
  const fixedValue = Math.abs(numberValue).toFixed(2);
  const [integerPart, decimalPart] = fixedValue.split(".");

  const lastThreeDigits = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  const formattedInteger =
    otherDigits.length > 0
      ? `${otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThreeDigits}`
      : lastThreeDigits;
  const signedInteger = isNegative ? `-${formattedInteger}` : formattedInteger;
  return decimalPart ? `${signedInteger}.${decimalPart}` : signedInteger;
};
