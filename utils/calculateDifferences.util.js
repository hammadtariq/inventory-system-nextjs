// Algorithm for calculating the differences between old and new values
export const calculateDifferences = (newData, oldData) => {
  const fieldsToCalculate = ["noOfBales", "baleWeightLbs", "baleWeightKgs"];
  const differences = {};

  for (const key in newData) {
    if (Array.isArray(newData[key]) && Array.isArray(oldData[key])) {
      differences[key] = calculateArrayDifferences(newData[key], oldData[key], fieldsToCalculate);
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

const calculateArrayDifferences = (newItems, oldItems, fieldsToCalculate) => {
  const oldItemsById = new Map(oldItems.filter((item) => item?.id != null).map((item) => [String(item.id), item]));
  const newItemIds = new Set(newItems.filter((item) => item?.id != null).map((item) => String(item.id)));

  const itemDifferences = newItems.map((newItem, index) => {
    const oldItem = newItem?.id != null ? oldItemsById.get(String(newItem.id)) || {} : oldItems[index] || {};
    const diff = calculateDifferences(newItem, oldItem);

    if (newItem.id) {
      diff.id = newItem.id;
    }

    return diff;
  });

  oldItems.forEach((oldItem) => {
    if (!oldItem?.id || newItemIds.has(String(oldItem.id))) return;

    const removedItemDiff = {
      id: oldItem.id,
      itemName: oldItem.itemName,
      companyId: oldItem.companyId,
    };

    fieldsToCalculate.forEach((field) => {
      if (typeof oldItem[field] === "number") {
        removedItemDiff[field] = -oldItem[field];
      }
    });

    itemDifferences.push(removedItemDiff);
  });

  return itemDifferences;
};
