const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const Fuse = require("fuse.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Đọc dữ liệu người thu gom từ file JSON
const DATA_PATH = path.join(__dirname, "collectors-data.json");

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

function findCollectorsByAddress(address, collectors, { threshold = 0.25, limit = 5 } = {}) {
  const query = normalize(address);
  if (!query) return [];

  const fuse = buildFuse(collectors, threshold);
  const results = fuse.search(query, { limit });

  return results.map((r) => {
    const confidence = Math.max(0, Math.min(1, 1 - (r.score ?? 1)));
    return { collector: r.item, score: confidence };
  });
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

// API: Lấy toàn bộ danh sách người thu gom
app.get("/api/collectors", (req, res) => {
  const collectors = loadCollectors();
  res.json(collectors);
});

// API: Tìm người thu gom theo địa chỉ
app.get("/api/search", (req, res) => {
  const address = req.query.address || "";
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

  const matches = findCollectorsByAddress(address, collectors, { threshold: 0.25, limit: 5 });
  const suggestions = matches.length
    ? []
    : findCollectorsByAddress(address, collectors, { threshold: 0.5, limit: 5 });

  res.json({
    address,
    matches,
    suggestions
  });
});

// Phục vụ file tĩnh (frontend)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});


