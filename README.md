## Dự án: Tra cứu người thu gom rác theo địa chỉ

### 1. Mục tiêu
- **Chức năng chính**: Người dân truy cập web, nhập địa chỉ nhà, hệ thống hiển thị **tên** và **số điện thoại** của người thu gom rác phụ trách khu vực đó.

### 2. Cấu trúc dự án
- **`index.html`**: Giao diện web.
- **`style.css`**: Giao diện, màu sắc, bố cục.
- **`app.js`**: Logic đọc dữ liệu và tìm kiếm theo địa chỉ.
- **`collectors-data.json`**: Dữ liệu người thu gom rác (có thể thay bằng dữ liệu thực tế).

### 3. Cách chạy dự án (đơn giản, không cần cài đặt gì phức tạp)
#### Cách 1: Mở trực tiếp (không khuyến khích cho fetch JSON)
- Mở file `index.html` bằng trình duyệt.
- Một số trình duyệt chặn `fetch` file JSON khi mở trực tiếp, nếu không thấy kết quả hãy dùng Cách 2.

#### Cách 2: Chạy với server tĩnh đơn giản
- **Cách dùng Python (nếu máy có Python)**:
  - Mở Command Prompt / PowerShell tại thư mục dự án.
  - Chạy:
    - Python 3:
      ```bash
      python -m http.server 8000
      ```
  - Mở trình duyệt và truy cập: `http://localhost:8000`

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
  - So sánh phần địa chỉ chuẩn hóa với từng `keywords` của nhân viên.
  - Nếu khớp, hiển thị nhân viên tương ứng (tên, điện thoại, khu vực phụ trách).


