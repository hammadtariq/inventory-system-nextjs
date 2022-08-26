export const kgLbConversion = (data, form) => {
  const { e, name } = data;
  switch (name) {
    case "baleWeightKgs":
      return form.setFieldsValue({
        ["baleWeightLbs"]: Number((e * 2.20462262).toFixed(2)),
      });

    case "baleWeightLbs":
      return form.setFieldsValue({
        ["baleWeightKgs"]: Number((e / 2.20462262).toFixed(2)),
      });

    default:
      break;
  }
};
