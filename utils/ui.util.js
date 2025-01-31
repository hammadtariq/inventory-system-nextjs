import _isString from "lodash/isString";

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

export const DATE_TIME_FORMAT = "DD-MM-YYYY HH:MM A";

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

export const DEFAULT_PAGE_LIMIT = 50;

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

export const sumBundles = (data = []) =>
  data.reduce((acc, curr) => {
    const { noOfBales = 0 } = curr || {};
    acc += noOfBales;
    return acc;
  }, 0);

export const isBase64 = (str) => {
  // const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  // return base64regex.test(str);
  if (str === "" || (_isString(str) && str.trim() === "")) {
    return false;
  }
  try {
    return window.btoa(window.atob(str)) === str;
  } catch (err) {
    return false;
  }
};

export const toLowerCaseObjVal = (values) => {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value && typeof value === "string" ? value.toLowerCase() : value,
    ])
  );
};

export const PRINT_TYPE = {
  WITH_RATES: "WITH_RATES",
  WITHOUT_RATES: "WITHOUT_RATES",
};

export const downloadFile = (file, filename) => {
  const link = document.createElement("a");
  const date = new Date();
  const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}_${date.getTime()}`;
  filename = `${filename}_${dateString}.xlsx`;
  if (!isBase64(file)) {
    link.href = file;

    link.onclick = "window.open(this.href,'_blank');return false";
  } else {
    link.href = `data:application/octet-stream;base64,${file}`;

    link.setAttribute("download", filename);

    link.target = "_blank";
  }

  document.body.appendChild(link);

  link.click();
};
export const PAGE_TYPE_VIEW = "view";
