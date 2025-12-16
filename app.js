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

// Một số từ chung trong địa chỉ (không giúp phân biệt khu vực)
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

function renderResult(matches, address, suggestions = []) {
  resultSection.classList.remove("hidden");
  if (!matches || !matches.length) {
    const suggestionCards =
      suggestions && suggestions.length
        ? suggestions
            .map(({ collector, score }) => {
              const phoneClean = collector.phone.replace(/\s+/g, "");
              const scoreText =
                score >= 1 ? "theo từ khóa" : `gợi ý ~${Math.round(score * 100)}%`;
              return `
                <div class="collector">
                  <div class="collector-title">Gợi ý gần đúng (${scoreText})</div>
                  <div><strong>Họ tên:</strong> ${collector.name}</div>
                  <div class="collector-phone">
                    <strong>Số điện thoại:</strong>
                    <a href="tel:${phoneClean}">${collector.phone}</a>
                  </div>
                  <div class="collector-area">
                    <strong>Khu vực phụ trách:</strong> ${collector.areaDescription}
                  </div>
                </div>
              `;
            })
            .join("<hr />")
        : "";

    resultContent.innerHTML = `
      <p class="status error">
        Không tìm thấy người thu gom rác trùng khớp cho địa chỉ:
        <strong>${address}</strong>.
      </p>
      ${
        suggestionCards
          ? `<p class="status info">Gợi ý gần đúng nhất:</p>${suggestionCards}`
          : `<p class="status info">Vui lòng kiểm tra lại cách ghi địa chỉ hoặc liên hệ với đơn vị môi trường.</p>`
      }
    `;
    return;
  }

  const cards = matches
    .map(({ collector, score }) => {
      const phoneClean = collector.phone.replace(/\s+/g, "");
      const scoreText = score >= 1 ? "theo từ khóa" : `độ khớp ~${Math.round(score * 100)}%`;
      return `
        <div class="collector">
          <div class="collector-title">Người thu gom phụ trách (${scoreText})</div>
          <div><strong>Họ tên:</strong> ${collector.name}</div>
          <div class="collector-phone">
            <strong>Số điện thoại:</strong>
            <a href="tel:${phoneClean}">${collector.phone}</a>
          </div>
          <div class="collector-area">
            <strong>Khu vực phụ trách:</strong> ${collector.areaDescription}
          </div>
        </div>
      `;
    })
    .join("<hr />");

  resultContent.innerHTML = `
    ${cards}
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
    const res = await fetch(`/api/search?address=${encodeURIComponent(address)}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("API tra cuu loi");
    }

    const data = await res.json();
    renderResult(data.matches, address, data.suggestions);
  } catch (err) {
    console.error(err);
    resultContent.innerHTML = `
      <p class="status error">
        Có lỗi khi gọi API tra cứu người thu gom. Vui lòng thử lại sau.
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


