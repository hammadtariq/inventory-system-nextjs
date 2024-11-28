// Algorithm for calculating the differences between old and new values
export const calculateDifferences = (newData, oldData) => {
  const fieldsToCalculate = ["noOfBales", "baleWeightLbs", "baleWeightKgs"];
  const differences = {};

  for (const key in newData) {
    if (Array.isArray(newData[key]) && Array.isArray(oldData[key])) {
      // Handle array differences
      differences[key] = newData[key].map((newItem, index) => {
        const oldItem = oldData[key][index] || {};
        const itemDifferences = calculateDifferences(newItem, oldItem);
        if (newItem.id) {
          itemDifferences.id = newItem.id;
        }
        return itemDifferences;
      });
    } else if (
      typeof newData[key] === "object" &&
      typeof oldData[key] === "object" &&
      newData[key] !== null &&
      oldData[key] !== null
    ) {
      // Handle nested object differences
      differences[key] = calculateDifferences(newData[key], oldData[key]);
    } else if (newData[key] !== oldData[key]) {
      // Compute scalar differences
      if (fieldsToCalculate.includes(key) && typeof newData[key] === "number" && typeof oldData[key] === "number") {
        // For specific fields, calculate the difference
        differences[key] = newData[key] - oldData[key];
      } else {
        // For other fields, just return the new value
        differences[key] = newData[key];
      }
    }
  }

  return differences;
};
