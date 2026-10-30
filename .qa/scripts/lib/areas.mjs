// Product areas and the source paths that belong to each (`areas` in .qa/config.json), so a PR runs the tests of
// the areas it touches: { "purchases": ["src/purchases/**", "app/api/purchases/**"] }. Tests carry @area-<name>.

const NAME = /^[a-z0-9][a-z0-9-]*$/;
export const AREA_TAG = "@area-";

// The area names in a test's tags (@area-purchases -> purchases).
export const areaTagsOf = (tags) => tags.filter((t) => t.startsWith(AREA_TAG)).map((t) => t.slice(AREA_TAG.length));

// The configured areas as { name: [patterns] }, or {} when unset. Throws on a name a tag can't carry.
export function validatedAreas(cfg) {
  const areas = cfg.areas || {};
  for (const [name, paths] of Object.entries(areas)) {
    if (!NAME.test(name))
      throw new Error(
        `areas: "${name}" must be lower-case letters, digits and dashes (it becomes the tag ${AREA_TAG}${name})`
      );
    if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string"))
      throw new Error(`areas.${name}: expected a list of paths`);
  }
  return areas;
}

// {a,b} in a glob as one glob per choice.
const expandBraces = (g) => {
  const m = g.match(/\{([^{}]*)\}/);
  return m
    ? m[1].split(",").flatMap((alt) => expandBraces(g.slice(0, m.index) + alt + g.slice(m.index + m[0].length)))
    : [g];
};

// One brace-free glob as a RegExp source: ** spans folders, * and ? stay within one, [ab] is one of.
function globSource(g) {
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    const close = c === "[" ? g.indexOf("]", i + 2) : -1;
    if (c === "*" && g[i + 1] === "*") {
      i++;
      if (g[i + 1] === "/") {
        i++;
        re += "(?:.*/)?";
      } else re += ".*";
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (close !== -1) {
      re += `[${g
        .slice(i + 1, close)
        .replace(/^!/, "^")
        .replace(/\\/g, "\\\\")}]`;
      i = close;
    } else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return re;
}

// A path glob as a RegExp (paths from the repo root). A path with no glob characters, or one ending in / or
// /**, also matches the folder itself and everything below it.
export function globToRegExp(glob) {
  let g = glob.replace(/^\.\//, "").replace(/\/+$/, "/**");
  if (!/[*?[{]/.test(g)) g += "/**";
  const globs = expandBraces(g).flatMap((x) => (x.endsWith("/**") ? [x.slice(0, -3), x] : [x]));
  return new RegExp(`^(?:${globs.map(globSource).join("|")})$`);
}

// Which areas the changed files touch, and the files that belong to no area.
export function touchedAreas(files, areas) {
  const matchers = Object.entries(areas).map(([name, paths]) => [name, paths.map(globToRegExp)]);
  const touched = new Set();
  const outside = [];
  for (const file of files) {
    const hits = matchers.filter(([, res]) => res.some((re) => re.test(file))).map(([name]) => name);
    hits.forEach((n) => touched.add(n));
    if (!hits.length) outside.push(file);
  }
  return { touched: [...touched].sort(), outside };
}

// A Playwright --grep for the smoke tests plus the touched areas' tests (whole tags only: @area-pay, not @area-payroll).
export const grepFor = (touched) =>
  touched.length ? `@smoke|${AREA_TAG}(?:${touched.join("|")})(?![\\w-])` : "@smoke";
