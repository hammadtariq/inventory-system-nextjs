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
      required: false,
      message: "Please select time!",
    },
  ],
};

export const STATUS_COLORS = {
  PENDING: "#FFC900",
  APPROVED: "#4E9F3D",
  CANCEL: "#F05454",
  EDIT: "#f58748",
};

export const CHEQUE_STATUS_COLORS = {
  PENDING: "#FFC900",
  PASS: "#4E9F3D",
  CANCEL: "#FFC900",
  RETURN: "#ff4d4f",
};

export const DEFAULT_PAGE_LIMIT = 10;

export const sumItemsPrice = (data = []) =>
  data.reduce((acc, curr) => {
    const {
      ratePerKgs = 0,
      baleWeightKgs = 0,
      ratePerLbs = 0,
      baleWeightLbs = 0,
      noOfBales = 0,
      ratePerBale = 0,
    } = curr || {};

    if (ratePerKgs && baleWeightKgs) {
      acc += ratePerKgs * baleWeightKgs;
      return acc;
    } else if (ratePerLbs && baleWeightLbs) {
      acc += ratePerLbs * baleWeightLbs;
      return acc;
    } else if (noOfBales && ratePerBale) {
      acc += noOfBales * ratePerBale;
      return acc;
    } else {
      return acc;
    }
  }, 0);
