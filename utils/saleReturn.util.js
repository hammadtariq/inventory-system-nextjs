export const getSaleReturnItemKey = ({ id, companyId }) => `${id}-${companyId}`;

export const getReturnedMetricsMap = (saleReturns = []) =>
  saleReturns.reduce((acc, saleReturn) => {
    (saleReturn.returnedProducts || []).forEach((product) => {
      const key = getSaleReturnItemKey(product);
      if (!acc[key]) {
        acc[key] = {
          noOfBales: 0,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        };
      }
      acc[key].noOfBales += Number(product.noOfBales || 0);
      acc[key].baleWeightKgs += Number(product.baleWeightKgs || 0);
      acc[key].baleWeightLbs += Number(product.baleWeightLbs || 0);
    });
    return acc;
  }, {});

export const getReturnedQuantityMap = (saleReturns = []) => {
  const metricsMap = getReturnedMetricsMap(saleReturns);
  return Object.keys(metricsMap).reduce((acc, key) => {
    acc[key] = metricsMap[key].noOfBales;
    return acc;
  }, {});
};

export const getReturnableProducts = (soldProducts = [], returnedMetricsMap = {}) =>
  soldProducts
    .map((product) => {
      const key = getSaleReturnItemKey(product);
      const soldQuantity = Number(product.noOfBales || 0);
      const returnedMetrics = returnedMetricsMap[key] || {};
      const alreadyReturnedQuantity = Number(returnedMetrics.noOfBales || 0);
      const remainingQuantity = Math.max(soldQuantity - alreadyReturnedQuantity, 0);
      const originalKgs = product.baleWeightKgs ?? null;
      const originalLbs = product.baleWeightLbs ?? null;
      const remainingKgs =
        originalKgs === null
          ? null
          : Math.max(Number(originalKgs || 0) - Number(returnedMetrics.baleWeightKgs || 0), 0);
      const remainingLbs =
        originalLbs === null
          ? null
          : Math.max(Number(originalLbs || 0) - Number(returnedMetrics.baleWeightLbs || 0), 0);

      return {
        ...product,
        noOfBales: remainingQuantity,
        baleWeightKgs: remainingKgs,
        baleWeightLbs: remainingLbs,
        onHand: remainingQuantity,
        refundableQuantity: remainingQuantity,
      };
    })
    .filter((product) => Number(product.refundableQuantity || 0) > 0);
