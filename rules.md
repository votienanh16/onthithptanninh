# Quy Chuẩn Kỹ Thuật & Thiết Kế Hệ Thống Ôn Thi Trực Tuyến - THPT An Ninh

Tài liệu này quy định các nguyên tắc kiến trúc, hạ tầng triển khai, cấu trúc đề thi và quy chuẩn giao diện cho dự án **Hệ Thống Ôn Thi Trực Tuyến - THPT An Ninh (Tây Ninh)**.

---

## 1. Hạ Tầng & Đường Dẫn Chính Thức (Cloudflare Pages)

- **Địa chỉ triển khai chính thức:** `https://onthithptanninh.pages.dev/`
- **Nền tảng lưu trữ:** Cloudflare Pages (Web tĩnh 100%, không giới hạn băng thông và số lượng học sinh truy cập đồng thời).
- **Quy tắc đường dẫn & Chia sẻ:**
  - Mọi thẻ `<link rel="canonical">`, Open Graph (`og:url`), trình tạo Link chia sẻ (`buildExamShareUrl`) và thông báo đồng bộ trong ứng dụng đều trỏ về `https://onthithptanninh.pages.dev/` (hoặc origin `http(s)` hiện tại khi chạy thực tế).
  - Tuyệt đối không giữ các liên kết Netlify cũ, không thực hiện request tới `/api/*` hoặc `./exams-data.json` trên trang tĩnh (tránh lỗi 404 console), và không hiển thị cảnh báo giới hạn credit hay lượt truy cập.
  - Dữ liệu đề thi, kết quả bài làm và Bảng xếp hạng được lưu an toàn qua `localStorage` kết hợp Link chia sẻ nén (`LZString` `#de=...`), mã QR và gói sao lưu `.JSON`.

---

## 2. Quy Chuẩn Cấu Trúc Đề Thi (Chỉ 3 Phần Chuẩn — Bỏ Hoàn Toàn Tự Luận / Essay)

Hệ thống **chỉ hỗ trợ 3 dạng câu hỏi chuẩn cấu trúc mới của Bộ GD&ĐT**, đảm bảo **chấm điểm tự động 100%**:

1. **Phần I: Trắc nghiệm nhiều lựa chọn (`A, B, C, D`)**
   - Cú pháp: `Câu <n>. ...`, phương án `*A.` / `B.` / `C.` / `D.` hoặc `Đáp án: A..D`.
   - Trọng số chuẩn: **0.25 điểm / câu**.
2. **Phần II: Trắc nghiệm Đúng / Sai (`a, b, c, d`)**
   - Cú pháp: `Câu <n>. ...`, các mệnh đề `*a)` (Đúng), `b)` (Sai), `*c)` (Đúng), `d)` (Sai).
   - Quy tắc tính điểm từng ý chuẩn Bộ GD&ĐT (tối đa **1.0 điểm / câu**):
     - Đúng 1/4 ý: `0.10` điểm hệ số
     - Đúng 2/4 ý: `0.25` điểm hệ số
     - Đúng 3/4 ý: `0.50` điểm hệ số
     - Đúng 4/4 ý: `1.00` điểm hệ số
3. **Phần III: Trắc nghiệm Trả lời ngắn**
   - Cú pháp: `Câu <n>. ...` kèm khối `ANSWER KEYS` ở cuối đề (`1.123`, `2.234`...) hoặc dòng `Đáp án:` / `Đáp số:` ngay trong câu hỏi.
   - Hỗ trợ so sánh số học chính xác kể cả phân số (`1/2` tương đương `0.5` hoặc `0,5`) và tránh lỗi `parseFloat` sai lệch.
   - Trọng số chuẩn: **0.50 điểm / câu**.
4. **Quy tắc loại bỏ Tự luận (Essay):**
   - Không hiển thị, không tạo bộ lọc, không parse và không chấm câu hỏi Tự luận (`PHẦN IV. TỰ LUẬN`, `PHẦN TỰ LUẬN`, `TỰ LUẬN`...). Khi nhập văn bản hoặc tải file lên, các khối tiêu đề/câu hỏi thuộc mục Tự luận sẽ được tự động lược bỏ để đề thi luôn sạch và chấm tự động 100%.

---

## 3. Tiêu Chuẩn Giao Diện Pastel & Mobile-First Responsive

- **Typography:** Google Font **Quicksand** (`400, 500, 600, 700`), thân thiện với học sinh THPT.
- **Bảng màu Pastel chủ đạo:**
  - Nền kem dịu (`#FFFDF9`) phối gradient nhẹ Hồng Pastel (`#FFF0F5`), Xanh Bạc Hà (`#ECFDF5`), Vàng Bơ (`#FFFBEB`), Tím Lavender (`#F5F3FF`).
  - Trạng thái Đúng: Xanh lá Pastel (`bg-emerald-50`, `border-emerald-300`); Trạng thái Sai / Cảnh báo: Hồng Pastel (`bg-rose-50`, `border-rose-300`).
- **Thư viện giao diện & Công thức (CDN):**
  - Tailwind CSS Play CDN
  - Lucide Icons (`lucide@latest`)
  - KaTeX (`0.16.9`) hiển thị công thức Toán - Lý - Hóa
  - Mammoth.js (`.docx`), SheetJS (`.xlsx/.xls/.csv`), PDF.js (`.pdf`), LZString, QRCode
  - Chart.js (`4.4.1`), canvas-confetti (`1.9.2`), html2canvas (`1.4.1`).
- **Quy chuẩn Responsive & Bảo mật bắt buộc:**
  - Không tràn ngang trên mọi kích thước màn hình từ mobile `375px` đến desktop `1920px` (`overflow-x: hidden`, `.katex-display { overflow-x: auto }`, `.no-scrollbar`).
  - Khi ở Phòng thi (`#tab-exam`), ẩn thanh Header chính để thanh đồng hồ đếm ngược dính (`#exam-sticky-bar`) luôn nằm gọn `top-2` với `0px` che khuất.
  - Tất cả modal căn giữa theo viewport (`max-w-[calc(100vw-1.5rem)]`, `max-h-[88dvh]`), hỗ trợ bấm nền hoặc phím `Escape` để đóng.
  - Mọi URL ảnh đều được kiểm tra hợp lệ (`sanitizeImageUrl`) chống XSS; file xuất `.CSV` được escape dấu ngoặc kép và chặn Formula Injection (`=`, `+`, `-`, `@`).

---

## 4. Năm Tính Năng EdTech Nâng Cao (Client-Side 100%)

1. **Kho câu hay sai & Lặp lại ngắt quãng (`#tab-vault`, `STORAGE_VAULT_KEY`):**
   - Tự động lưu câu làm sai kèm đáp án đúng, giải thích, chuyên đề và mốc ôn tập giãn cách (`1 ngày → 3 ngày → 7 ngày`).
   - Tích hợp **Chart.js Radar Chart** (`#vault-radar-chart`) biểu diễn mức độ hay sai theo 6 chuyên đề cốt lõi và nút **"Ôn lại câu sai"** 1-click mở phòng luyện tập tức thì.
2. **Chế độ Flashcard lật mặt 3D (`#tab-flashcard`, `STORAGE_FLASHCARD_KEY`):**
   - Lấy dữ liệu Phần I & Phần II (hoặc từ Kho câu hay sai), thẻ lật 3D mượt (`perspective: 1000px`, `preserve-3d`), nút **"Đã nhớ"** / **"Cần ôn lại"**, hỗ trợ chạm & vuốt trái/phải trên điện thoại.
3. **Xuất Phiếu Phân Tích Kết Quả PNG / PDF (`#result-report-card`):**
   - Hiển thị tên học sinh, tên đề, tổng điểm, điểm chi tiết **Phần I - Trắc nghiệm**, **Phần II - Đúng/Sai**, **Phần III - Trả lời ngắn** và chuyên đề cần ôn lại; hỗ trợ **"Tải phiếu kết quả (PNG)"** (`html2canvas`) và **"In / Lưu PDF"**.
4. **Thử thách Speedrun 5 phút & Chuỗi Combo (`#tab-speedrun`, `STORAGE_SPEEDRUN_KEY`):**
   - Đồng hồ đếm ngược 300 giây, tính điểm theo chuỗi đúng liên tiếp (**Combo x1, x2, x3**), mascot nhảy cổ vũ, bắn `canvas-confetti` và lưu kỷ lục cá nhân (High Score) vào `localStorage`.
5. **Chuỗi ngày học (Study Streak) & Đồng hồ Pomodoro (`STORAGE_STREAK_KEY`, `#pomodoro-widget`):**
   - Biểu tượng ngọn lửa Study Streak hiển thị trên Header & Trang chủ theo ngày thực tế, kèm widget đồng hồ Pomodoro thu gọn ở góc màn hình (25 phút Tập trung / 5 phút Nghỉ ngơi) tự hiển thị khi vào chế độ Ôn luyện.

---

## 5. Chuẩn Đọc File Word (`.docx`) Azota Vật Lí / Toán Học & Công Thức Inline

1. **Chuyển đổi HTML giữ cấu trúc (`mammoth.convertToHtml` + DOM Serialization):**
   - Không dùng `extractRawText` làm trình đọc chính. Giữ nguyên cấu trúc đoạn văn (`<p>`, bảng `<td>/<th>`), chỉ số trên/dưới (`<sup>`, `<sub>` cho $A^2$, $v_{\max}$, $W_{\text{đ}}$, $x_1$) và ký hiệu Hy Lạp ($\omega, \varphi, \pi, \Delta...$).
   - Mọi ảnh công thức nhúng trong file Word được chuyển thành `<img src="data:image/..." class="inline-formula">` ngay đúng vị trí trong câu hỏi và từng phương án/mệnh đề (bảo toàn nền trong suốt PNG cho công thức nhỏ).
   - CSS `.inline-formula`: `display: inline-block; vertical-align: middle; max-height: 2.4em; margin: 0 2px; max-width: 100%; height: auto;` (co gọn còn `2.1em` trên màn hình `< 640px` để không làm vỡ nút đáp án A/B/C/D).
2. **Chuẩn hóa tách đề Azota 3 phần (`parseAzotaText`) & Chấm `ANSWER KEYS`:**
   - Bảo vệ thẻ `<img src="data:image/..." class="inline-formula">` bằng token tạm trước khi chạy regex để chuỗi base64 không gây tách nhầm `A.` / `a)`.
   - Nhận diện phương án Phần I (`*A.`, `B.`, `C.`, `D.`) và mệnh đề Phần II (`*a)`, `b)`, `c)`, `d)`) kể cả khi nội dung phương án chỉ có một thẻ `<img class="inline-formula">` hoặc bị bọc trong `<p>`, `<strong>`, `<u>`.
   - Khối `ANSWER KEYS` hỗ trợ phân tách bằng xuống dòng, dấu gạch đứng `|`, hoặc dấu `;` theo dạng `<số_câu>.<đáp_án>` (ví dụ `23.0,5 | 24.9 | 26.0,64`). Hàm `compareShortAnswer` chuẩn hóa cả dấu phẩy `,` và dấu chấm `.` (học sinh nhập `0.5` hay `0,5` đều được chấm đúng).
3. **Hiển thị an toàn đồng bộ (`formatSafeExamHTML` + KaTeX):**
   - Tất cả màn hình (Xem trước tạo đề `#tab-create`, Phòng thi `#tab-exam`, Xem kết quả `#tab-result`, Kho câu hay sai `#tab-vault`, Flashcard `#tab-flashcard`, Speedrun `#tab-speedrun`) đều dùng `formatSafeExamHTML` để render `<img class="inline-formula">`, `<sup>`, `<sub>` chống XSS kết hợp KaTeX (`$...$`, `$$...$$`).
