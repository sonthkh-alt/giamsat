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
Người dùng: Thường trực HĐND tỉnh, các Ban của HĐND tỉnh, Tổ đại biểu và đại biểu
HĐND tỉnh, Văn phòng, và Thường trực HĐND của **166 xã, phường** (147 xã, 19 phường).

### Cơ sở pháp lý — phần mềm phải phản ánh đúng, không được thiết kế theo ý tưởng riêng

- **Luật Hoạt động giám sát của Quốc hội và HĐND số 121/2025/QH15**, hiệu lực 01/3/2026.
  Điều 28 (giám sát của HĐND), Điều 31 (Thường trực HĐND), Điều 34 (Ban của HĐND),
  Điều 36 (đại biểu HĐND), Điều 37 (Tổ đại biểu), **Điều 40** (bảo đảm thực hiện nghị quyết,
  kết luận, kiến nghị giám sát — thời hạn giải trình 15 ngày, phức tạp không quá 30 ngày).
- **Nghị quyết 114/2025/UBTVQH15** — hướng dẫn hoạt động giám sát của HĐND.
  Điều 15 (các nhóm báo cáo), Điều 24 (nghị quyết sau chất vấn), Điều 40 (nghị quyết
  thành lập Đoàn giám sát), Điều 48 (giám sát của Tổ đại biểu).
- **Nghị quyết 115/2025/UBTVQH15** — giám sát văn bản quy phạm pháp luật.
- Luật Ban hành VBQPPL số 64/2025/QH15 và Luật số 87/2025/QH15 sửa đổi, bổ sung.
- Nghị định 30/2020/NĐ-CP về công tác văn thư (thể thức văn bản).

Bối cảnh: từ 01/7/2025 tỉnh vận hành chính quyền hai cấp; HĐND cấp xã được khôi phục
thẩm quyền ban hành VBQPPL; VBQPPL của cấp huyện cũ chỉ còn hiệu lực **đến hết
28/02/2027** → khối lượng nghị quyết cấp xã ban hành thay thế rất lớn trong giai đoạn này.
Hệ thống phải chịu được vài nghìn bản ghi nghị quyết mỗi năm.

---

## 2. Xương sống dữ liệu: 12 nhóm nghiệp vụ giám sát

Đây là quyết định kiến trúc quan trọng nhất. **Mọi hồ sơ trong hệ thống đều thuộc
đúng một trong 12 nhóm dưới đây**, và được gắn đồng thời ba thuộc tính: nhóm nghiệp vụ,
chủ thể giám sát, cấp hành chính.

| Mã | Nhóm nghiệp vụ | Căn cứ chính |
|---|---|---|
| GS-01 | Xem xét, thẩm tra báo cáo | Đ.28.1.a L121; Đ.15 NQ114 |
| GS-02 | Giám sát văn bản quy phạm pháp luật | Đ.28.1.b, Đ.31 L121; NQ115 |
| GS-03 | Chất vấn và xem xét trả lời chất vấn | Đ.28.1.c L121; Đ.24 NQ114 |
| GS-04 | Hoạt động giải trình | Đ.31.2 L121 |
| GS-05 | Giám sát chuyên đề | Đ.28.1.d, Đ.31, Đ.34 L121; Đ.40 NQ114 |
| GS-06 | Giám sát giải quyết khiếu nại, tố cáo, kiến nghị, phản ánh | Đ.31, Đ.34 L121 |
| GS-07 | Giám sát giải quyết, trả lời kiến nghị cử tri | Đ.31, Đ.34.1.c L121 |
| GS-08 | Giám sát việc thi hành pháp luật ở địa phương | Đ.36, Đ.37 L121; Đ.48 NQ114 |
| GS-09 | Lấy phiếu tín nhiệm, bỏ phiếu tín nhiệm | Đ.28.3 L121 |
| GS-10 | Giám sát việc thực hiện nghị quyết về giám sát | Đ.28.1.e L121 |
| GS-11 | Theo dõi thực hiện kết luận, kiến nghị giám sát | Đ.28.1.g, Đ.40 L121 |
| GS-12 | Giám sát lại, xem xét trách nhiệm, xử lý sau giám sát | Đ.40 L121 |

**Ba thuộc tính bắt buộc của mọi hồ sơ:**

```ts
type ThuocTinhHoSo = {
  nhomGS: 'GS-01' | 'GS-02' | ... | 'GS-12';
  chuThe: 'hdnd' | 'thuong_truc' | 'ban' | 'to_dai_bieu' | 'dai_bieu';
  cap: 'tinh' | 'xa';
};
```

Nhờ đó cùng một kho dữ liệu kết xuất được báo cáo theo bất kỳ chiều nào mà không nhập lại.

**Bộ đầu mục dữ liệu của từng nhóm nằm trong `data/khung-nghiep-vu.json`, không hard-code.**
Khi quy định pháp luật thay đổi, người quản trị sửa file cấu hình — không sửa mã nguồn.
Đây là yêu cầu bắt buộc, không phải tùy chọn.

Cấp xã dùng chung bộ mã này với phạm vi thu gọn: GS-01, 02, 03, 05, 06, 07, 10, 11, 12
áp dụng đầy đủ; GS-04 và GS-09 theo quy định đối với cấp xã; GS-08 khi được giao nhiệm vụ.

---

## 3. Quy tắc nghiệp vụ trọng yếu — không được làm sai

### 3.1 Lựa chọn nghị quyết cấp xã để rà soát (GS-02)

**Không có bốc thăm tự động. Không có `Math.random()` quyết định thay con người.**

Thẩm quyền quyết định danh mục thuộc **Thường trực HĐND tỉnh**, theo từng tháng.
Phần mềm chỉ tập hợp, phân tích, xếp hạng và **trình danh mục đề xuất**.

Năm cách thức lập danh mục đề xuất, dùng kết hợp, mỗi văn bản phải ghi rõ áp dụng cách nào:

1. `chuyen_de` — theo lĩnh vực trọng tâm Thường trực ấn định cho tháng đó.
2. `canh_bao` — theo dấu hiệu hệ thống phát hiện (xem 3.2), xếp hạng theo điểm rủi ro.
3. `de_nghi` — theo đề nghị của UBND tỉnh, Ban Thường trực UBMTTQ tỉnh, đại biểu Quốc hội,
   các Ban và đại biểu HĐND tỉnh; phản ánh của cử tri, cơ quan báo chí.
4. `luan_phien` — ưu tiên đơn vị lâu chưa được rà soát, bảo đảm trong năm không đơn vị nào bị bỏ sót.
5. `ngau_nhien` — **chỉ bổ sung phần còn lại của danh mục**. Vai trò bổ trợ, không thay thế
   bốn cách trên. Khi dùng, vẫn phải ghi seed vào bản ghi để tra lại được.

**Quy trình theo tháng — cài đúng các mốc này:**

| Mốc | Việc |
|---|---|
| Ngày 20 | Hệ thống tổng hợp nghị quyết cập nhật trong kỳ, chạy phân tích, xếp hạng |
| Ngày 25 | Văn phòng trình danh mục đề xuất kèm lý do từng văn bản |
| Phiên họp Thường trực | Quyết định danh mục chính thức, ghi vào thông báo kết luận |
| Mở đợt | Hệ thống phân công Ban theo lĩnh vực; Ban Pháp chế tổng hợp chung |
| +10 ngày làm việc | Hoàn thành thẩm định, ghi kết quả |
| +5 ngày làm việc | Đơn vị giải trình; hết hạn thì chốt kết quả |
| Phiên họp tháng sau | Công bố kết quả đợt rà soát |

Thường trực HĐND tỉnh có quyền **thêm hoặc bỏ bất kỳ văn bản nào** khỏi danh mục đề xuất.
Giao diện phải cho phép việc đó một cách rõ ràng, và ghi lại ai sửa, sửa lúc nào.
Ngoài danh mục hằng tháng, Thường trực và các Ban được yêu cầu xem xét bất kỳ văn bản nào
vào bất kỳ lúc nào khi phát hiện dấu hiệu trái pháp luật.

### 3.2 Dấu hiệu cảnh báo tự động

Hệ thống chấm điểm rủi ro để xếp hạng đề xuất, **không kết luận thay người**:

- Viện dẫn căn cứ pháp lý đã hết hiệu lực hoặc đã được thay thế.
- Sử dụng tên cơ quan, đơn vị hành chính không còn đúng sau sắp xếp 01/7/2025.
- Dấu hiệu vượt thẩm quyền theo lĩnh vực.
- Thiếu thành phần bắt buộc của hồ sơ trình.
- Sai thể thức, kỹ thuật trình bày theo Nghị định 30/2020/NĐ-CP.

Mọi cảnh báo phải kèm **lý do cụ thể và trích dẫn vị trí trong văn bản**. Cảnh báo không
giải thích được lý do thì không hiển thị.

### 3.3 Chấm điểm thẩm định

Thang 100, năm nhóm: thẩm quyền và hình thức (20) · trình tự, thủ tục (20) ·
tính hợp hiến, hợp pháp, thống nhất (30) · thể thức, kỹ thuật trình bày (10) ·
tính khả thi, phù hợp thực tiễn và tổ chức thực hiện (20).

Xếp loại: Tốt ≥ 90 · Khá 75–89 · Đạt 60–74 · Chưa đạt < 60.

**Nếu `coNoiDungTraiPhapLuat === true` thì luôn là `chua_dat`, bất kể tổng điểm.**

### 3.4 Theo dõi sau giám sát (GS-11, GS-12)

Nguyên tắc: **hồ sơ không kết thúc khi ban hành kết luận, mà kết thúc khi kiến nghị
được thực hiện xong.**

Mỗi kết luận, kiến nghị tách thành các nhiệm vụ độc lập. Sáu trạng thái:
`hoan_thanh` · `hoan_thanh_mot_phan` · `chua_hoan_thanh` · `qua_han` ·
`khong_thuc_hien` · `chua_dap_ung_yeu_cau`.

Nhắc trước hạn **15 / 7 / 3 ngày**; quá hạn chuyển cảnh báo đỏ và khởi tạo quy trình
yêu cầu giải trình theo Điều 40 Luật 121/2025/QH15: **15 ngày, phức tạp không quá 30 ngày**.

Bảy bước xử lý, ghi nhận đủ ngày tháng và văn bản của từng bước:
đôn đốc lần 1 → đôn đốc lần tiếp theo → kiến nghị cấp có thẩm quyền xử lý →
đưa vào phiên giải trình → đưa vào nội dung chất vấn → tổ chức giám sát lại →
báo cáo HĐND xem xét.

### 3.5 Hạn xử lý

Mọi thời hạn tính theo **ngày làm việc** trừ khi luật ghi rõ là ngày (Điều 40 ghi
"15 ngày" — là ngày, không phải ngày làm việc). Trừ thứ Bảy, Chủ nhật và ngày nghỉ lễ
trong `data/ngayle.json`. Viết hàm dùng chung `nghiepvu/hanXuLy.ts`, **bắt buộc có kiểm thử**.
Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (UTC+7).

---

## 4. Ràng buộc kiến trúc — đọc kỹ trước khi đề xuất công nghệ

GitHub Pages là **static hosting: không backend, không server-side code, không database**.

| Nhu cầu | Giải pháp |
|---|---|
| Hiển thị dữ liệu | File JSON trong `data/`, tải bằng `fetch()` khi chạy |
| Ghi / upload dữ liệu | Trang quản trị gọi **GitHub Contents API** commit thẳng vào `main` |
| Xác thực người ghi | **Fine-grained PAT** người dùng tự dán, lưu ở `sessionStorage` |
| Lưu file nghị quyết (PDF) | Commit vào `data/files/<năm>/`, giới hạn ≤ 10 MB/file |
| Tự động phát hành | GitHub Actions build + deploy Pages sau mỗi commit |

**Không tự ý thay bằng Firebase / Supabase / Vercel Functions** trừ khi được yêu cầu.
Nếu giới hạn của phương án tĩnh chặn một tính năng, **nói rõ giới hạn đó** và đề xuất,
không âm thầm đổi kiến trúc.

### Cảnh báo bảo mật phải luôn tôn trọng

- Kho mã đang **public**. Mọi thứ commit lên đều công khai vĩnh viễn.
- **Tuyệt đối không** commit PAT, token, mật khẩu, khóa API — kể cả trong file ví dụ.
- **Không** đưa lên dữ liệu cá nhân của công dân, nội dung đơn thư (GS-06), thông tin
  thuộc phạm vi bí mật nhà nước. Nghị quyết là văn bản phải công khai nên đưa lên được.
- **GS-09 (tín nhiệm) không triển khai trên kho public.** Nhóm này áp dụng chế độ bảo mật
  cao nhất; để lại đến khi có hạ tầng riêng.
- Kết quả thẩm định chỉ hiển thị công khai sau khi hết hạn giải trình 5 ngày làm việc.
  Trước đó đánh dấu `trangThai: 'chua_chot'` và ẩn khỏi giao diện công khai.
- Nếu cần thực sự riêng tư phải chuyển sang kho private — nhưng Pages cho kho private
  đòi hỏi gói trả phí. Nêu rõ đánh đổi này khi được hỏi.

---

## 5. Công nghệ và cấu trúc

- **Vite + React 18 + TypeScript**, **Tailwind CSS**, **React Router** dùng `HashRouter`
- `base: '/giamsat/'` trong `vite.config.ts`
- Đọc/ghi GitHub qua `fetch` trực tiếp tới `api.github.com`, không thêm SDK nặng
- Không thêm thư viện mới nếu chuẩn web đã làm được; mỗi dependency mới phải giải thích lý do

```bash
npm install
npm run dev        # chạy nội bộ
npm run build      # build ra dist/
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run lint
```

```
/
├─ CLAUDE.md
├─ src/
│  ├─ trang/          # TongQuan, KhungNghiepVu, DanhMucRaSoat, ThamDinh,
│  │                  # TheoDoiSauGiamSat, HoiDap, QuanTri
│  ├─ thanhphan/      # component dùng chung
│  ├─ dulieu/         # đọc JSON, ghi qua GitHub API
│  ├─ nghiepvu/       # logic thuần: xepHangRuiRo.ts, chamDiem.ts, hanXuLy.ts, lapDanhMuc.ts
│  └─ kieu/           # TypeScript types
├─ data/
│  ├─ khung-nghiep-vu.json   # 12 nhóm GS và bộ đầu mục dữ liệu — cấu hình, không hard-code
│  ├─ donvi.json             # 166 xã, phường
│  ├─ tieuchi.json           # bộ tiêu chí 100 điểm
│  ├─ ngayle.json
│  ├─ nghiquyet/2026.json
│  ├─ dotrasoat/2026-10.json # theo tháng
│  ├─ ketqua/2026.json
│  ├─ nhiemvu/2026.json      # nhiệm vụ sau giám sát (GS-11, GS-12)
│  ├─ hoidap.json
│  └─ files/2026/...
└─ .github/workflows/deploy.yml
```

---

## 6. Quy ước mã nguồn

- **Giao diện, thông báo, nhãn: tiếng Việt có dấu.** Không có chữ tiếng Anh lọt ra màn hình.
- **Định danh trong mã: tiếng Việt không dấu, camelCase** — `nghiQuyet`, `donVi`,
  `dotRaSoat`, `danhMucDeXuat`, `tinhDiem()`, `hanXuLy`. Dùng tiếng Việt cho khái niệm
  nghiệp vụ giúp đối chiếu với Quy chế dễ hơn nhiều so với dịch sang tiếng Anh.
- Từ khóa kỹ thuật thuần (`useState`, `fetch`, `props`) giữ nguyên tiếng Anh.
- Commit message tiếng Việt, thể mệnh lệnh, có phạm vi:
  `danhMuc: cho phép Thường trực bỏ văn bản khỏi danh mục đề xuất`.
- Ngày tháng: lưu ISO `YYYY-MM-DD`, hiển thị `dd/MM/yyyy`.
- Không dùng `any`. Không nuốt lỗi bằng `catch {}` rỗng.

### Kiểu dữ liệu cốt lõi

```ts
type DotRaSoat = {
  ky: string;                    // "2026-10"
  linhVucTrongTam: string | null;
  danhMucDeXuat: MucDeXuat[];
  danhMucChinhThuc: string[];    // id nghị quyết, sau khi Thường trực quyết định
  vanBanQuyetDinh: string;       // số thông báo kết luận phiên họp
  ngayMoDot: string;
  hanThamDinh: string;
  trangThai: 'de_xuat' | 'da_quyet_dinh' | 'dang_tham_dinh' | 'da_chot';
};

type MucDeXuat = {
  idNghiQuyet: string;
  cachThuc: 'chuyen_de' | 'canh_bao' | 'de_nghi' | 'luan_phien' | 'ngau_nhien';
  lyDo: string;                  // bắt buộc, hiển thị cho Thường trực khi quyết định
  diemRuiRo: number;
  canhBao: CanhBao[];
  nguoiDeXuat: string;
};

type NhiemVuSauGiamSat = {
  id: string;
  nguonGoc: { nhomGS: string; soVanBan: string; ngayBanHanh: string };
  noiDungYeuCau: string;
  coQuanChuTri: string;
  coQuanPhoiHop: string[];
  nguoiChiuTrachNhiem: string;
  sanPhamPhaiHoanThanh: string;
  hanHoanThanh: string;
  trangThai: 'hoan_thanh' | 'hoan_thanh_mot_phan' | 'chua_hoan_thanh'
           | 'qua_han' | 'khong_thuc_hien' | 'chua_dap_ung_yeu_cau';
  minhChung: string[];
  buocXuLy: BuocXuLy[];          // 7 bước tại mục 3.4
};
```

---

## 7. Định hướng thiết kế giao diện

Công cụ làm việc của cơ quan dân cử, dùng hằng tháng trong nhiều năm.
Ưu tiên **đọc nhanh, thao tác ít, tin cậy** hơn ấn tượng thị giác.
Tránh phong cách landing page: không gradient lớn, không thẻ bo tròn nổi bóng,
không biểu tượng cảm xúc, không số liệu khổng lồ kiểu tiếp thị.

**Bảng màu** (đặt trong `tailwind.config.js`):

| Vai trò | Mã | Dùng cho |
|---|---|---|
| `muc` | `#16264F` | Chữ chính, thanh điều hướng, tiêu đề |
| `giay` | `#FFFFFF` | Nền trang |
| `nen` | `#F1F3F7` | Nền vùng, hàng xen kẽ |
| `vien` | `#D8DCE5` | Đường kẻ, viền bảng |
| `dat` | `#1F6F54` | Hoàn thành, đạt |
| `luuy` | `#B87503` | Sắp đến hạn, chờ giải trình |
| `canhbao` | `#C8102E` | Quá hạn, chưa đạt, trái pháp luật |

Đỏ chỉ dùng cho cảnh báo thật, không dùng làm màu trang trí.

**Chữ:** giao diện `Be Vietnam Pro`; trích nội dung văn bản gốc `Noto Serif`
(để phân biệt rõ đâu là văn bản gốc, đâu là chữ của phần mềm); số liệu và mã văn bản
`IBM Plex Mono`. Cỡ chữ nội dung tối thiểu 16px — người dùng gồm cả đại biểu lớn tuổi.

**Điểm nhấn của sản phẩm — "bàn làm việc danh mục tháng".**
Màn hình chính là bàn quyết định của Thường trực: bên trái là danh mục đề xuất, mỗi dòng
hiện rõ cách thức lựa chọn, điểm rủi ro và lý do; Thường trực đưa sang phải để vào danh mục
chính thức, hoặc loại ra kèm ghi chú. Trạng thái danh mục hiện ngay trên đầu.
Đây là hình ảnh đại diện của hệ thống — nó thể hiện đúng nguyên tắc "máy đề xuất,
người quyết định". Mọi thứ xung quanh giữ mức trầm, tiết chế.

Bổ trợ: lưới 166 ô ở trang tổng quan, mỗi ô một xã phường, đổ màu theo số ngày kể từ
lần rà soát gần nhất — phục vụ cách thức `luan_phien`.

**Sàn chất lượng bắt buộc:** chạy tốt trên điện thoại (đại biểu kiêm nhiệm dùng điện thoại
là chính); mọi thao tác nghiệp vụ thường xuyên ≤ 3 bước, ≤ 5 phút; thấy rõ viền focus khi
dùng bàn phím; tôn trọng `prefers-reduced-motion`; tương phản đạt WCAG AA.

**Câu chữ:** dùng đúng từ ngữ trong Quy chế — "danh mục rà soát", "thẩm định", "giải trình",
"chốt kết quả", "kết luận, kiến nghị sau giám sát", "đôn đốc", "tái giám sát".
Nút ghi rõ việc sẽ xảy ra ("Chốt kết quả", không phải "Gửi"). Màn hình trống là lời mời
làm việc. Thông báo lỗi nói rõ chuyện gì và cách khắc phục.

---

## 8. Cách làm việc mong muốn

- **Trước khi viết mã cho một tính năng, mô tả ngắn cách làm và chờ xác nhận** nếu tính năng
  đó động tới quy tắc ở mục 3, tới khung 12 nhóm nghiệp vụ, tới lược đồ dữ liệu, hoặc tới
  quyền ghi lên GitHub. Việc nhỏ, rõ ràng thì cứ làm.
- Sau mỗi thay đổi: chạy `npm run typecheck`, `npm run test`, `npm run build`, sửa hết lỗi
  rồi mới báo xong.
- Kiểm thử bằng Vitest cho `nghiepvu/` — logic thuần, không phụ thuộc giao diện.
  `hanXuLy.ts`, `chamDiem.ts` và `lapDanhMuc.ts` **bắt buộc** có kiểm thử.
- Không tự ý commit và push nếu chưa được yêu cầu. Nêu rõ những file sẽ thay đổi trước.
- Dữ liệu mẫu để chạy thử đặt trong `data/mau/` và ghi rõ là dữ liệu giả lập.
  **Không bịa số liệu thật về xã, phường cụ thể.**
- Nếu một yêu cầu mâu thuẫn với quy tắc nghiệp vụ ở mục 3, nói ra thay vì lặng lẽ làm theo.

---

## 9. Lộ trình

**Giai đoạn 1 — thí điểm (đến 12/2026), làm trước:**
1. Khung 12 nhóm nghiệp vụ và chương trình giám sát năm
   (`khung-nghiep-vu.json` cùng giao diện quản trị).
2. GS-02 — kho nghị quyết cấp xã, phân tích cảnh báo, danh mục rà soát hằng tháng,
   thẩm định, giải trình, chốt kết quả.
3. GS-11 và GS-12 — theo dõi nhiệm vụ sau giám sát, nhắc việc, bảy bước xử lý.
4. Cầu nối hai cấp — hỏi/đáp nghiệp vụ, thư viện văn bản mẫu, bảng tin.
   Triển khai thử với 15 xã, phường; chạy đợt rà soát thử nghiệm đầu tiên.

**Giai đoạn 2 (quý I–II/2027):** hoàn thiện sau thí điểm; bổ sung GS-01, GS-03, GS-04;
mở cho 166 đơn vị; phân quyền đầy đủ.

**Giai đoạn 3 (từ quý III/2027 đến 2028):** bổ sung GS-05, GS-06, GS-07, GS-08;
bảng điều khiển và bộ chỉ số; ứng dụng di động; kết nối kho dữ liệu dùng chung của tỉnh.
GS-09 chỉ triển khai khi có hạ tầng bảo mật riêng.

Đừng xây trước tính năng của giai đoạn sau. Làm xong, dùng được, rồi mới mở rộng.
