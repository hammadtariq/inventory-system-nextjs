const HTML_ESCAPE_MAP = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
};

export const stringifyForHtml = (value) => {
  return JSON.stringify(value).replace(/[<>&]/g, (character) => HTML_ESCAPE_MAP[character]);
};
