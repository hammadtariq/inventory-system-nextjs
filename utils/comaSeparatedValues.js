export const comaSeparatedValues = (value) => {
  const numberValue = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(numberValue)) {
    throw new Error("Input must be a valid number");
  }

  const fixedValue = numberValue.toFixed(2);
  const [integerPart, decimalPart] = fixedValue.split(".");

  const lastThreeDigits = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  const formattedInteger =
    otherDigits.length > 0
      ? `${otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThreeDigits}`
      : lastThreeDigits;
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};
