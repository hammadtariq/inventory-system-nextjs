export const validateMessages = {
  required: "${label} is required!",
  types: {
    email: "${label} is not a valid email!",
    number: "${label} is not a valid number!",
  },
  number: {
    range: "${label} must be between ${min} and ${max}",
  },
};

export const layout = {
  labelCol: {
    span: 2,
  },
  wrapperCol: {
    span: 12,
  },
};

export const itemsList = ["SMALL_BALES", "BIG_BALES"];

export const datePickerConfig = {
  rules: [
    {
      type: "object",
      required: true,
      message: "Please select time!",
    },
  ],
};
