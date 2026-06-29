const https = require("https");

const SITE_URL = "https://www.treesols.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = "6571853fa78c483fd41f1b2656e54b23";
const INDEXNOW_KEY_FILE = `${INDEXNOW_KEY}.txt`;

const indexablePaths = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/inventory-management-software",
  "/inventory-accounting-software",
  "/inventory-software-south-asia",
];

function toUrl(pathName) {
  return pathName === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathName}`;
}

function buildIndexNowPayload() {
  return {
    host: "www.treesols.com",
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY_FILE}`,
    urlList: indexablePaths.map(toUrl),
  };
}

function submitIndexNow(payload = buildIndexNowPayload()) {
  const body = JSON.stringify(payload);
  const endpoint = new URL(INDEXNOW_ENDPOINT);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        method: "POST",
        hostname: endpoint.hostname,
        path: endpoint.pathname,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const responseBody = Buffer.concat(chunks).toString("utf8");

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve({ statusCode: response.statusCode, body: responseBody });
            return;
          }

          reject(new Error(`IndexNow submission failed with ${response.statusCode}: ${responseBody}`));
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

if (require.main === module) {
  submitIndexNow()
    .then(({ statusCode, body }) => {
      console.log(JSON.stringify({ statusCode, body, submittedUrls: buildIndexNowPayload().urlList.length }, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = {
  INDEXNOW_KEY,
  INDEXNOW_KEY_FILE,
  buildIndexNowPayload,
  submitIndexNow,
};
