export const VALIDATE_MESSAGE = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};

export const LAYOUT = {
  labelCol: {
    span: 2,
  },
  wrapperCol: {
    span: 12,
  },
};

export const ITEMS_LIST = ["SMALL_BALES", "BIG_BALES"];

export const DATE_FORMAT = "DD-MM-YYYY";

export const DATE_PICKER_CONFIG = {
  rules: [
    {
      type: "object",
      required: true,
      message: "Please select time!",
    },
  ],
};

export const STATUS_COLORS = {
  PENDING: "#FFC900",
  APPROVED: "#4E9F3D",
  CANCEL: "#F05454",
};

export const CHEQUE_STATUS_COLORS = {
  PENDING: "#FFC900",
  PASS: "#4E9F3D",
  CANCEL: "#FFC900",
  RETURN: "#ff4d4f",
};

export const DEFAULT_PAGE_LIMIT = 10;

export const sumItems = (data = []) =>
  data.reduce((acc, curr) => {
    const { ratePerKgs, baleWeightKgs, ratePerLbs, baleWeightLbs, noOfBales, ratePerBale } = curr || {};

    if (ratePerKgs && baleWeightKgs) {
      acc += ratePerKgs * baleWeightKgs || 0;
      return acc;
    } else if (ratePerLbs && baleWeightLbs) {
      acc += ratePerBale * baleWeightLbs || 0;
      return acc;
    } else if (noOfBales && ratePerBale) {
      acc += noOfBales * ratePerBale || 0;
      return acc;
    } else {
      return acc;
    }
  }, 0);
