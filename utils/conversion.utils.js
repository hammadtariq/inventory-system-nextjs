export const kgLbConversion = (data, form) => {
  const { e, name, id } = data;
  const values = form.getFieldsValue();

  switch (name) {
    case "baleWeightKgs":
      values[id]["baleWeightLbs"] = Number((e * 2.2046).toFixed(2));
      return form.setFieldsValue(values);

    case "baleWeightLbs":
      values[id]["baleWeightKgs"] = Number((e / 2.2046).toFixed(2));
      return form.setFieldsValue(values);

    default:
      break;
  }
};
