# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trên kho mã này.

---

## 1. Dự án là gì

**Hệ thống phần mềm quản lý hoạt động giám sát của cơ quan dân cử tỉnh Thanh Hóa**
— tên giao dịch: **Giám sát số Thanh Hóa**.

Kho mã: `https://github.com/sonthkh-alt/giamsat` (public, nhánh mặc định `main`).
Trang web chạy trên **GitHub Pages**.

Chủ đầu tư nghiệp vụ: Thường trực HĐND tỉnh Thanh Hóa.
Cơ quan thường trực: Văn phòng Đoàn ĐBQH và HĐND tỉnh.
Người dùng: Thường trực HĐND tỉnh, các Ban của HĐND tỉnh, đại biểu HĐND tỉnh,
Văn phòng, và Thường trực HĐND của **166 xã, phường** (147 xã, 19 phường).

### Bài toán nghiệp vụ

1. **Kiểm tra ngẫu nhiên nghị quyết HĐND cấp xã.** 8h00 sáng thứ Hai hằng tuần,
   hệ thống rút thăm điện tử một số nghị quyết đã ban hành để thẩm định, chấm điểm
   theo thang 100. Việc rút thăm phải **khách quan, có nhật ký, không ai can thiệp được**.
2. **Theo dõi vòng đời kiến nghị sau giám sát** — trạng thái, thời hạn, nhắc việc,
   cảnh báo quá hạn, tính tỷ lệ thực hiện đúng hạn.
3. **Cầu nối HĐND tỉnh ↔ HĐND cấp xã** — hỏi/đáp nghiệp vụ, ngân hàng tình huống,
   thư viện văn bản mẫu, bảng tin điều hành.

### Bối cảnh pháp lý (ảnh hưởng đến thiết kế dữ liệu)

- Từ 01/7/2025 tỉnh vận hành chính quyền hai cấp; HĐND cấp xã được khôi phục thẩm quyền
  ban hành văn bản quy phạm pháp luật.
- Văn bản QPPL của HĐND, UBND cấp huyện cũ chỉ còn hiệu lực **đến hết 28/02/2027**
  → khối lượng nghị quyết cấp xã ban hành thay thế rất lớn trong giai đoạn này.
  Hệ thống phải chịu được vài nghìn bản ghi nghị quyết mỗi năm.
- Luật Hoạt động giám sát số 121/2025/QH15 (hiệu lực 01/3/2026).
- Thể thức văn bản theo Nghị định 30/2020/NĐ-CP.

---

## 2. Ràng buộc kiến trúc — đọc kỹ trước khi đề xuất công nghệ

Trang web chạy trên **GitHub Pages = static hosting, KHÔNG có backend, KHÔNG có
server-side code, KHÔNG có database**. Mọi thiết kế phải nằm gọn trong ràng buộc này.

### Cách giải quyết đã chốt

| Nhu cầu | Giải pháp |
|---|---|
| Hiển thị dữ liệu | Các file JSON trong `data/`, tải bằng `fetch()` khi chạy |
| Ghi / upload dữ liệu | Trang quản trị gọi **GitHub Contents API** để commit thẳng vào `main` |
| Xác thực người ghi | **Fine-grained PAT** người dùng tự dán vào trình duyệt, lưu ở `sessionStorage` |
| Lưu file nghị quyết (PDF) | Commit vào `data/files/<năm>/`, giới hạn ≤ 10 MB/file |
| Tự động phát hành | GitHub Actions build + deploy Pages sau mỗi commit |

**Không tự ý thay bằng Firebase / Supabase / Vercel Functions** trừ khi được yêu cầu.
Nếu thấy giới hạn của phương án tĩnh chặn một tính năng, hãy **nói rõ giới hạn đó**
và đề xuất, chứ không âm thầm đổi kiến trúc.

### Cảnh báo bảo mật phải luôn tôn trọng

- Kho mã đang **public**. Mọi thứ commit lên đều công khai vĩnh viễn.
- **Tuyệt đối không** commit PAT, token, mật khẩu, khóa API — kể cả trong file ví dụ.
  PAT chỉ tồn tại trong `sessionStorage` của trình duyệt người dùng.
- **Không** đưa lên dữ liệu cá nhân của công dân, nội dung đơn thư, thông tin thuộc
  phạm vi bí mật nhà nước. Nghị quyết là văn bản phải công khai nên đưa lên được.
- **Kết quả chấm điểm, xếp loại đơn vị là dữ liệu nhạy cảm về mặt hành chính.**
  Ở giai đoạn thí điểm, lưu điểm chi tiết trong `data/ketqua/` nhưng chỉ hiển thị công khai
  sau khi đã hết thời hạn giải trình 5 ngày làm việc; trước đó đánh dấu `trangThai: "chua_chot"`
  và ẩn khỏi giao diện công khai.
- Nếu cần thực sự riêng tư, phải chuyển sang kho private — nhưng GitHub Pages cho kho
  private đòi hỏi gói trả phí. Nêu rõ đánh đổi này khi được hỏi.

---

## 3. Công nghệ

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** cho style
- **React Router** với `HashRouter` (Pages không rewrite được URL)
- `base: '/giamsat/'` trong `vite.config.ts`
- Đọc/ghi GitHub qua `fetch` trực tiếp tới `api.github.com` — không thêm SDK nặng
- Không thêm thư viện mới nếu chuẩn web đã làm được. Mỗi dependency mới phải giải thích lý do.

### Lệnh

```bash
npm install
npm run dev        # chạy nội bộ
npm run build      # build ra dist/
npm run preview    # xem thử bản build
npm run typecheck  # tsc --noEmit
npm run lint
```

### Cấu trúc thư mục

```
/
├─ CLAUDE.md
├─ index.html
├─ vite.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ trang/            # các trang: TongQuan, RutTham, ThamDinh, KienNghi, HoiDap, QuanTri
│  ├─ thanhphan/        # component dùng chung
│  ├─ dulieu/           # lớp truy cập dữ liệu: đọc JSON, ghi qua GitHub API
│  ├─ nghiepvu/         # logic thuần: rutTham.ts, chamDiem.ts, hanXuLy.ts
│  └─ kieu/             # định nghĩa TypeScript types
├─ data/
│  ├─ donvi.json
│  ├─ tieuchi.json
│  ├─ nghiquyet/2026.json
│  ├─ dotkiemtra/2026-W31.json
│  ├─ ketqua/2026.json
│  ├─ kiennghi/2026.json
│  ├─ hoidap.json
│  └─ files/2026/...    # bản PDF nghị quyết
└─ .github/workflows/deploy.yml
```

---

## 4. Quy ước mã nguồn

- **Giao diện, thông báo, nhãn: tiếng Việt có dấu.** Không có chữ tiếng Anh lọt ra màn hình.
- **Định danh trong mã: tiếng Việt không dấu, camelCase** — `nghiQuyet`, `donVi`,
  `dotKiemTra`, `tinhDiem()`, `hanXuLy`. Dùng tiếng Việt cho khái niệm nghiệp vụ
  giúp đối chiếu với Quy chế dễ hơn nhiều so với dịch sang tiếng Anh.
- Từ khóa kỹ thuật thuần (`useState`, `fetch`, `props`) giữ nguyên tiếng Anh.
- Commit message: tiếng Việt, thể mệnh lệnh, có phạm vi.
  Ví dụ: `rutTham: khoá seed theo tuần ISO và ghi nhật ký`.
- Ngày tháng: lưu ISO `YYYY-MM-DD`, hiển thị `dd/MM/yyyy`.
- Múi giờ: mọi mốc thời gian nghiệp vụ tính theo `Asia/Ho_Chi_Minh` (UTC+7).
- Không dùng `any`. Không nuốt lỗi bằng `catch {}` rỗng.

---

## 5. Mô hình dữ liệu

Định nghĩa đầy đủ đặt trong `src/kieu/`. Bản phác:

```ts
type DonVi = {
  ma: string;           // "TH-001"
  ten: string;          // "Phường Hạc Thành"
  loai: 'xa' | 'phuong';
  vung: 'dong_bang' | 'ven_bien' | 'mien_nui';
  lanKiemTraGanNhat: string | null;  // ISO date
};

type NghiQuyet = {
  id: string;                 // "<maDonVi>-<so>-<nam>"
  maDonVi: string;
  so: string;                 // "12"
  kyHieu: string;             // "NQ-HĐND"
  ngayBanHanh: string;
  kyHop: string;
  loai: 'quy_pham' | 'ca_biet';
  linhVuc: 'ngan_sach' | 'dau_tu_cong' | 'dat_dai' | 'phi_le_phi'
         | 'to_chuc_bo_may' | 'che_do_chinh_sach' | 'khac';
  trichYeu: string;
  hieuLuc: 'con_hieu_luc' | 'het_hieu_luc' | 'da_thay_the';
  tepDinhKem: string[];       // đường dẫn trong data/files/
  ngayCapNhat: string;
};

type DotKiemTra = {
  ky: string;                 // "2026-W31"
  ngayRutTham: string;
  seed: string;               // công khai, để kiểm chứng lại
  thamSoTrongSo: Record<string, number>;
  danhSachTrung: string[];    // id nghị quyết
  nguoiPhanCong: Record<string, string>;
};

type KetQuaThamDinh = {
  idNghiQuyet: string;
  ky: string;
  diemNhom: {                 // tổng 100
    thamQuyenHinhThuc: number;      // 20
    trinhTuThuTuc: number;          // 20
    noiDungHopPhap: number;         // 30
    theThucTrinhBay: number;        // 10
    khaThiThucTien: number;         // 20
  };
  tongDiem: number;
  xepLoai: 'tot' | 'kha' | 'dat' | 'chua_dat';
  coNoiDungTraiPhapLuat: boolean;   // true ⇒ ép xuống "chua_dat"
  nhanXet: string;
  nguoiThamDinh: string;
  hanGiaiTrinh: string;
  giaiTrinh: string | null;
  trangThai: 'chua_chot' | 'da_chot';
};

type KienNghi = {
  id: string;
  nguonGiamSat: string;
  noiDung: string;
  coQuanChiuTrachNhiem: string;
  hanThucHien: string;
  trangThai: 'chua_thuc_hien' | 'dang_thuc_hien' | 'da_hoan_thanh' | 'khong_con_phu_hop';
  minhChung: string[];
  ngayXacNhan: string | null;
};
```

---

## 6. Ba quy tắc nghiệp vụ không được làm sai

### 6.1 Rút thăm phải kiểm chứng được

Trang web tĩnh không có server đáng tin, nên tính khách quan phải đến từ **tính tái lập**:

- Dùng PRNG có seed cố định (xorshift128 hoặc mulberry32 tự viết trong `nghiepvu/rutTham.ts`),
  **không dùng `Math.random()`**.
- `seed = "<năm>-W<tuần ISO>-<maMuoi>"`, trong đó `maMuoi` là chuỗi muối công bố trước
  trong `data/cauhinh.json`.
- Ghi vào `DotKiemTra`: seed, toàn bộ trọng số, danh sách ứng viên đầu vào và kết quả.
- Trang "Rút thăm" phải có nút **"Chạy lại để kiểm chứng"** — bất kỳ ai cũng tính lại được
  và ra đúng kết quả cũ. Đây là điểm mấu chốt để cơ sở tin vào tính công bằng.
- Trọng số ưu tiên: đơn vị chưa kiểm tra trong 6 tháng ×3; lĩnh vực ngân sách / đầu tư công /
  đất đai / phí lệ phí / tổ chức bộ máy / chế độ chính sách ×2; đơn vị kỳ trước "chưa đạt" ×2.

### 6.2 Chấm điểm

Thang 100, năm nhóm như trong `KetQuaThamDinh`. Xếp loại:
Tốt ≥ 90 · Khá 75–89 · Đạt 60–74 · Chưa đạt < 60.
**Nếu `coNoiDungTraiPhapLuat === true` thì luôn là "chua_dat", bất kể tổng điểm.**

### 6.3 Hạn xử lý

- Thẩm định: 5 ngày làm việc kể từ ngày nhận hồ sơ.
- Giải trình của đơn vị: 5 ngày làm việc kể từ ngày nhận kết quả.
- Nhắc kiến nghị sau giám sát: trước hạn 15 / 7 / 3 ngày; quá hạn chuyển cảnh báo đỏ.
- Tính theo **ngày làm việc**, trừ thứ Bảy, Chủ nhật và ngày nghỉ lễ trong
  `data/ngayle.json`. Viết hàm dùng chung `nghiepvu/hanXuLy.ts`, có kiểm thử.

---

## 7. Định hướng thiết kế giao diện

Đây là công cụ làm việc của cơ quan dân cử, dùng hằng tuần trong nhiều năm.
Ưu tiên **đọc nhanh, thao tác ít, tin cậy** hơn là ấn tượng thị giác.
Tránh phong cách "landing page khởi nghiệp": không gradient lớn, không thẻ bo tròn nổi bóng,
không biểu tượng cảm xúc, không số liệu khổng lồ kiểu tiếp thị.

**Bảng màu** (đặt trong `tailwind.config.js`):

| Vai trò | Mã | Dùng cho |
|---|---|---|
| `muc` | `#16264F` | Chữ chính, thanh điều hướng, tiêu đề |
| `giay` | `#FFFFFF` | Nền trang |
| `nen` | `#F1F3F7` | Nền vùng, hàng xen kẽ |
| `vien` | `#D8DCE5` | Đường kẻ, viền bảng |
| `dat` | `#1F6F54` | Đạt, hoàn thành |
| `luuy` | `#B87503` | Sắp đến hạn, chờ giải trình |
| `canhbao` | `#C8102E` | Quá hạn, chưa đạt, trái pháp luật |

Đỏ chỉ dùng cho cảnh báo thật. Không dùng đỏ làm màu trang trí.

**Chữ:**
- Giao diện: `Be Vietnam Pro` (thiết kế riêng cho tiếng Việt, dấu chuẩn).
- Trích văn bản, nội dung nghị quyết: `Noto Serif` — giúp phân biệt rõ đâu là
  nội dung văn bản gốc, đâu là chữ của phần mềm.
- Số liệu, mã văn bản, seed rút thăm: `IBM Plex Mono`.
- Cỡ chữ nội dung tối thiểu 16px. Người dùng gồm cả đại biểu lớn tuổi.

**Điểm nhấn của sản phẩm — "lưới 166 ô".**
Trang tổng quan mở đầu bằng một lưới 166 ô vuông, mỗi ô là một xã, phường, đổ màu theo
số ngày kể từ lần kiểm tra gần nhất. Nhìn một cái là thấy ngay đơn vị nào đang bị bỏ quên.
Đây là hình ảnh đại diện của hệ thống — mọi thứ xung quanh giữ mức trầm, tiết chế.
Không thêm biểu đồ trang trí nếu nó không dẫn tới một hành động cụ thể.

**Sàn chất lượng bắt buộc:** chạy tốt trên điện thoại (đại biểu kiêm nhiệm dùng điện thoại
là chính); mọi thao tác nghiệp vụ thường xuyên ≤ 3 bước, ≤ 5 phút; thấy rõ viền focus khi
dùng bàn phím; tôn trọng `prefers-reduced-motion`; tương phản đạt WCAG AA.

**Câu chữ trên giao diện:** dùng đúng từ ngữ trong Quy chế — "rút thăm", "thẩm định",
"giải trình", "chốt kết quả", "kiến nghị sau giám sát". Nút ghi rõ việc sẽ xảy ra
("Chốt kết quả", không phải "Gửi"). Màn hình trống là lời mời làm việc, không phải
lời xin lỗi. Thông báo lỗi nói rõ chuyện gì và cách khắc phục.

---

## 8. Cách làm việc mong muốn

- **Trước khi viết mã cho một tính năng, mô tả ngắn cách làm và chờ xác nhận** nếu tính năng
  đó động tới quy tắc ở mục 6, tới lược đồ dữ liệu, hoặc tới quyền ghi lên GitHub.
  Việc nhỏ, rõ ràng thì cứ làm.
- Sau mỗi thay đổi: chạy `npm run typecheck` và `npm run build`, sửa hết lỗi rồi mới báo xong.
- Viết kiểm thử (Vitest) cho `nghiepvu/` — logic thuần, không phụ thuộc giao diện.
  `rutTham.ts` và `hanXuLy.ts` **bắt buộc** có kiểm thử.
- Không tự ý commit và push nếu chưa được yêu cầu. Nêu rõ những file sẽ thay đổi trước.
- Khi cần dữ liệu mẫu để chạy thử, tạo trong `data/mau/` và ghi rõ là dữ liệu giả lập.
  **Không bịa số liệu thật về xã, phường cụ thể.**
- Nếu một yêu cầu mâu thuẫn với Quy chế nghiệp vụ ở mục 6, nói ra thay vì lặng lẽ làm theo.

---

## 9. Lộ trình

**Giai đoạn 1 — thí điểm (đến 12/2026), làm trước:**
1. Cơ sở dữ liệu nghị quyết cấp xã: nhập liệu, tải tệp, tra cứu, lọc.
2. Rút thăm và thẩm định: rút thăm theo tuần, phiếu chấm điểm, giải trình, chốt kết quả.
3. Cầu nối: hỏi/đáp nghiệp vụ, thư viện văn bản mẫu, bảng tin.
   Triển khai thử với 15 xã, phường.

**Giai đoạn 2 (quý I–II/2027):** hoàn thiện sau thí điểm, mở cho 166 đơn vị, phân quyền đầy đủ.

**Giai đoạn 3 (từ quý III/2027):** theo dõi kiến nghị sau giám sát, kiến nghị cử tri,
bảng chỉ số, ứng dụng di động, kết nối kho dữ liệu dùng chung của tỉnh.

Đừng xây trước tính năng của giai đoạn sau. Làm xong, dùng được, rồi mới mở rộng.
