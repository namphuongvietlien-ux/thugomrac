const addressInput = document.getElementById("address-input");
const searchBtn = document.getElementById("search-btn");
const resultSection = document.getElementById("result-section");
const resultContent = document.getElementById("result-content");
const yearSpan = document.getElementById("year");

yearSpan.textContent = new Date().getFullYear().toString();

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function loadCollectors() {
  const res = await fetch("collectors-data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu người thu gom.");
  }
  return res.json();
}

function findCollectorByAddress(address, collectors) {
  const normalizedAddress = normalize(address);
  // Ưu tiên match theo từ khóa cấu hình sẵn
  for (const c of collectors) {
    if (!Array.isArray(c.keywords)) continue;
    for (const kw of c.keywords) {
      if (normalizedAddress.includes(normalize(kw))) {
        return c;
      }
    }
  }
  // Dự phòng: tìm theo tên đường trong mô tả khu vực
  for (const c of collectors) {
    if (!c.areaDescription) continue;
    const areaNorm = normalize(c.areaDescription);
    const tokens = areaNorm.split(" ");
    const streetTokens = tokens.slice(0, 3).join(" ");
    if (normalizedAddress.includes(streetTokens)) {
      return c;
    }
  }
  return null;
}

function renderResult(collector, address) {
  resultSection.classList.remove("hidden");
  if (!collector) {
    resultContent.innerHTML = `
      <p class="status error">
        Không tìm thấy người thu gom rác phụ trách cho địa chỉ:
        <strong>${address}</strong>.
      </p>
      <p class="status info">
        Vui lòng kiểm tra lại cách ghi địa chỉ hoặc liên hệ với đơn vị môi trường để được hỗ trợ.
      </p>
    `;
    return;
  }

  const phoneClean = collector.phone.replace(/\s+/g, "");

  resultContent.innerHTML = `
    <div class="collector">
      <div class="collector-title">Người thu gom phụ trách</div>
      <div><strong>Họ tên:</strong> ${collector.name}</div>
      <div class="collector-phone">
        <strong>Số điện thoại:</strong>
        <a href="tel:${phoneClean}">${collector.phone}</a>
      </div>
      <div class="collector-area">
        <strong>Khu vực phụ trách:</strong> ${collector.areaDescription}
      </div>
    </div>
    <p class="status info">
      Địa chỉ bạn nhập: <strong>${address}</strong>
    </p>
  `;
}

async function handleSearch() {
  const address = addressInput.value.trim();
  if (!address) {
    resultSection.classList.remove("hidden");
    resultContent.innerHTML = `
      <p class="status error">Vui lòng nhập địa chỉ trước khi tìm kiếm.</p>
    `;
    return;
  }

  resultSection.classList.remove("hidden");
  resultContent.innerHTML = `
    <p class="status info">Đang tìm kiếm người thu gom rác phù hợp...</p>
  `;

  try {
    const collectors = await loadCollectors();
    const collector = findCollectorByAddress(address, collectors);
    renderResult(collector, address);
  } catch (err) {
    console.error(err);
    resultContent.innerHTML = `
      <p class="status error">
        Có lỗi khi tải dữ liệu người thu gom. Vui lòng thử lại sau.
      </p>
    `;
  }
}

searchBtn.addEventListener("click", handleSearch);

addressInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});


