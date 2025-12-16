const fs = require("fs");
const path = require("path");
const Fuse = require("fuse.js");

const DATA_PATH = path.join(process.cwd(), "collectors-data.json");

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "duong",
  "so",
  "pho",
  "phuong",
  "khu",
  "ap",
  "thon",
  "xa",
  "huyen",
  "tinh",
  "thanh",
  "pho",
  "thi",
  "tran"
]);

function tokenizeAddress(str) {
  const norm = normalize(str);
  if (!norm) return [];
  return norm
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t));
}

function loadCollectors() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Loi doc collectors-data.json:", err);
    return [];
  }
}

function buildFuse(collectors, threshold = 0.25) {
  const docs = collectors.map((c) => {
    const keywordsText = Array.isArray(c.keywords) ? c.keywords.join(" ") : "";
    const areaText = c.areaDescription || "";
    const fuseTarget = normalize(`${keywordsText} ${areaText}`);
    return { ...c, fuseTarget };
  });

  return new Fuse(docs, {
    includeScore: true,
    keys: ["fuseTarget"],
    threshold,
    ignoreLocation: true,
    minMatchCharLength: 2
  });
}

function searchWithFuse(address, collectors, { threshold = 0.25, limit = 5 } = {}) {
  const query = normalize(address);
  if (!query) return [];

  const fuse = buildFuse(collectors, threshold);
  const results = fuse.search(query, { limit });

  return results.map((r) => {
    const confidence = Math.max(0, Math.min(1, 1 - (r.score ?? 1)));
    return { collector: r.item, score: confidence };
  });
}

module.exports = (req, res) => {
  const { address = "" } = req.query || {};

  if (!address.trim()) {
    return res.status(400).json({
      error: "Thiếu tham số 'address'"
    });
  }

  const collectors = loadCollectors();
  if (!collectors.length) {
    return res.status(500).json({
      error: "Không có dữ liệu người thu gom."
    });
  }

  // Kết quả chính xác: threshold 0.25, tối đa 5
  const matches = searchWithFuse(address, collectors, { threshold: 0.25, limit: 5 });
  // Gợi ý mềm hơn: threshold 0.5, tối đa 5
  const suggestions = matches.length
    ? []
    : searchWithFuse(address, collectors, { threshold: 0.5, limit: 5 });

  res.status(200).json({
    address,
    matches,
    suggestions
  });
};


