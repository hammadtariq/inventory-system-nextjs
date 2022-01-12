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
