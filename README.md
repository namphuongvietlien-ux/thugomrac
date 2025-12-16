## Dự án: Tra cứu người thu gom rác theo địa chỉ

### 1. Mục tiêu
- **Chức năng chính**: Người dân truy cập web, nhập địa chỉ nhà, hệ thống hiển thị **tên** và **số điện thoại** của người thu gom rác phụ trách khu vực đó.

### 2. Cấu trúc dự án
- **`index.html`**: Giao diện web.
- **`style.css`**: Giao diện, màu sắc, bố cục.
- **`app.js`**: Logic đọc dữ liệu và tìm kiếm theo địa chỉ.
- **`collectors-data.json`**: Dữ liệu người thu gom rác (có thể thay bằng dữ liệu thực tế).

### 3. Cách chạy dự án với Node.js (backend + frontend)

#### 3.1 Cài dependencies
- Mở PowerShell tại thư mục dự án:
  ```bash
  cd D:\gomrac
  npm install
  ```

#### 3.2 Chạy server
- Chạy server Node:
  ```bash
  npm start
  ```
- Server chạy tại: `http://localhost:3000`
- Mở trình duyệt và truy cập: `http://localhost:3000`

Backend Node.js (file `server.js`) sẽ:
- Phục vụ file tĩnh: `index.html`, `style.css`, `app.js`, ...
- Cung cấp API:
  - `GET /api/collectors`: trả về toàn bộ danh sách người thu gom.
  - `GET /api/search?address=...`: trả về **danh sách** người thu gom phù hợp (có thể nhiều người cùng tuyến), kèm điểm khớp và gợi ý gần đúng (fuzzy search).

### 4. Deploy backend + frontend lên Vercel

#### 4.1. Cách Vercel hoạt động với dự án này
- Frontend: Vercel sẽ phục vụ `index.html`, `style.css`, `app.js`, ... như site tĩnh.
- Backend: các file trong thư mục `api/`:
  - `api/search.js` tương đương endpoint `GET /api/search`.
  - `api/collectors.js` tương đương endpoint `GET /api/collectors`.
- Khi deploy lên Vercel, `app.js` gọi `/api/search?address=...` sẽ tự động đi vào hàm trong `api/search.js`.

`server.js` chủ yếu dùng để chạy **local** (trên máy bạn) khi cần backend dạng Express; lên Vercel thì đã có các hàm trong thư mục `api/` xử lý thay.

#### 4.2. Các bước deploy tóm tắt
1. Đưa toàn bộ mã nguồn (bao gồm `index.html`, `app.js`, `collectors-data.json`, thư mục `api/`, `package.json`, ...) lên GitHub.
2. Vào Vercel, đăng nhập bằng GitHub và **Import Project** từ repo đó.
3. Cấu hình:
   - Framework: **Other** hoặc **Static HTML**.
   - Build Command: để trống.
   - Output directory: `.`.
4. Bấm **Deploy**.
5. Sau khi deploy xong, Vercel cấp cho bạn 1 URL dạng `https://ten-project.vercel.app`, tại đó:
   - Giao diện người dùng truy cập bình thường.
   - Các request tới `/api/search` và `/api/collectors` chạy trên backend Node.js serverless của Vercel.

### 4. Cấu trúc dữ liệu người thu gom
- File: `collectors-data.json`
- Mỗi phần tử là một đối tượng:

```json
{
  "id": "NV001",
  "name": "Nguyễn Văn A",
  "phone": "0901 234 567",
  "areaDescription": "Đường Lê Lợi (số 1-200), Phường 1, Quận 3",
  "keywords": [
    "le loi",
    "lê lợi",
    "p1q3",
    "phuong 1 quan 3"
  ]
}
```

- **Giải thích**:
  - **`areaDescription`**: Mô tả khu vực phụ trách, hiển thị cho người dùng xem.
  - **`keywords`**: Danh sách từ khóa dùng để match với địa chỉ người dân nhập (đã được chuẩn hóa bỏ dấu, viết thường).

### 5. Cách nhập dữ liệu thực tế
- Xuất dữ liệu từ file Excel (`DS_NV_thugom.xlsx`) thành dạng CSV hoặc nhập tay.
- Tạo/ cập nhật file `collectors-data.json` theo đúng cấu trúc trên:
  - Mỗi nhân viên thu gom tạo 1 object.
  - Viết `areaDescription` rõ ràng, dễ hiểu.
  - Tạo 3–6 từ khóa đại diện cho tuyến đường, phường, quận,... để dễ tìm kiếm.

### 6. Cách hoạt động của tìm kiếm
- Người dùng nhập một đoạn địa chỉ (ví dụ: `123 Lê Lợi, P.1, Q.3`).
- Hệ thống:
  - Chuẩn hóa chuỗi (viết thường, bỏ dấu, bỏ ký tự đặc biệt).
  - Đọc `collectors-data.json`.
  - So sánh địa chỉ với `keywords` (ưu tiên cao nhất).
  - Nếu không có keyword match, tính độ khớp dựa trên trùng từ giữa địa chỉ và `areaDescription`.
  - Trả về **tất cả** nhân viên có độ khớp đủ cao, sắp xếp giảm dần theo điểm; frontend hiển thị nhiều người nếu cần (ví dụ một tuyến đường chia nhiều đoạn/ca).

### 7. Tự động chuyển file Excel `DS_NV_thugom.xlsx` sang `collectors-data.json`

Trong thư mục dự án đã có file `convert-excel-to-json.js` để hỗ trợ.

#### 7.1 Cấu hình mapping cột
- Mở file `convert-excel-to-json.js` và chỉnh lại phần:

```js
const COLUMN_MAP = {
  id: "Mã NV",              // tên cột mã NV trong Excel
  name: "Họ tên",           // tên cột họ tên
  phone: "SĐT",             // tên cột số điện thoại
  areaDescription: "Khu vực phụ trách", // tên cột mô tả khu vực
  keywords: "Từ khóa"       // tên cột chứa từ khóa (cách nhau bởi dấu phẩy hoặc chấm phẩy)
};
```

- Đảm bảo các chuỗi bên phải (ví dụ `"Mã NV"`, `"Họ tên"`, ...) trùng đúng với header của file Excel `DS_NV_thugom.xlsx`.

#### 7.2 Chạy chuyển đổi

```bash
cd D:\gomrac
npm install        # (chỉ lần đầu, nếu chưa cài)
npm run convert
```

- Script sẽ:
  - Đọc file `DS_NV_thugom.xlsx` (sheet đầu tiên).
  - Lấy từng dòng theo mapping ở `COLUMN_MAP`.
  - Tự động sinh file `collectors-data.json` mới.

Sau khi chạy xong:
- Kiểm tra lại nội dung `collectors-data.json`.
- Nếu đúng, `git add collectors-data.json` → `git commit` → `git push` để Vercel tự deploy dữ liệu mới.


