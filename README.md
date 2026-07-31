# Giám sát số Thanh Hóa

Hệ thống phần mềm quản lý hoạt động giám sát của cơ quan dân cử tỉnh Thanh Hóa.

- Chủ đầu tư nghiệp vụ: Thường trực Hội đồng nhân dân tỉnh Thanh Hóa
- Cơ quan thường trực: Văn phòng Đoàn đại biểu Quốc hội và Hội đồng nhân dân tỉnh
- Người dùng: Thường trực, các Ban, Tổ đại biểu và đại biểu Hội đồng nhân dân tỉnh, Văn phòng,
  và Thường trực Hội đồng nhân dân của 166 xã, phường

Trang chạy tại **https://sonthkh-alt.github.io/giamsat/**

---

## Xương sống: 12 nhóm nghiệp vụ giám sát

Mọi hồ sơ trong hệ thống thuộc đúng một trong 12 nhóm `GS-01`…`GS-12`, và được gắn đồng thời
ba thuộc tính: **nhóm nghiệp vụ · chủ thể giám sát · cấp hành chính**. Nhờ đó cùng một kho dữ
liệu kết xuất được báo cáo theo bất kỳ chiều nào mà không phải nhập lại.

Khung 12 nhóm và bộ đầu mục dữ liệu của từng nhóm nằm trong
[`data/khung-nghiep-vu.json`](data/khung-nghiep-vu.json) — **là cấu hình, không hard-code**.
Khi quy định pháp luật thay đổi, người quản trị sửa tệp cấu hình chứ không sửa mã nguồn.

Cơ sở pháp lý: Luật Hoạt động giám sát số 121/2025/QH15 (hiệu lực 01/3/2026), Nghị quyết
114/2025/UBTVQH15, Nghị quyết 115/2025/UBTVQH15, Luật Ban hành VBQPPL số 64/2025/QH15 và
Luật số 87/2025/QH15, Nghị định 30/2020/NĐ-CP.

---

## Nguyên tắc cốt lõi: máy đề xuất, người quyết định

**Không có bốc thăm tự động. Không có `Math.random()` quyết định thay con người.**

Thẩm quyền quyết định danh mục văn bản rà soát thuộc **Thường trực Hội đồng nhân dân tỉnh**,
theo từng tháng. Phần mềm chỉ tập hợp, phân tích, xếp hạng và **trình danh mục đề xuất**.

Năm cách thức lập danh mục, dùng kết hợp, mỗi văn bản ghi rõ áp dụng cách nào và vì sao:

| Thứ tự | Cách thức | Vai trò |
|---|---|---|
| 1 | `chuyen_de` | Theo lĩnh vực trọng tâm Thường trực ấn định cho tháng |
| 2 | `canh_bao` | Theo dấu hiệu hệ thống phát hiện, xếp hạng theo điểm rủi ro |
| 3 | `de_nghi` | Theo đề nghị của cơ quan, đại biểu, cử tri, báo chí |
| 4 | `luan_phien` | Ưu tiên đơn vị lâu chưa rà soát, để không đơn vị nào bị bỏ sót |
| 5 | `ngau_nhien` | **Chỉ bổ sung phần còn lại**, có ghi seed để tra lại |

Thường trực **thêm hoặc bỏ được bất kỳ văn bản nào**; mọi thay đổi đều ghi lại ai sửa và sửa
lúc nào vào `nhatKyThayDoi` của đợt.

**Quy trình theo tháng** — cài đúng trong `nghiepvu/lapDanhMuc.ts`:

| Mốc | Việc |
|---|---|
| Ngày 20 | Tổng hợp văn bản cập nhật trong kỳ, chạy phân tích, xếp hạng |
| Ngày 25 | Văn phòng trình danh mục đề xuất kèm lý do từng văn bản |
| Phiên họp Thường trực | Quyết định danh mục chính thức, ghi vào thông báo kết luận |
| Mở đợt | Phân công Ban theo lĩnh vực |
| +10 ngày làm việc | Hoàn thành thẩm định, ghi kết quả |
| +5 ngày làm việc | Đơn vị giải trình; hết hạn thì chốt kết quả |
| Phiên họp tháng sau | Công bố kết quả đợt rà soát |

---

## Dấu hiệu cảnh báo tự động

Hệ thống chấm điểm rủi ro để xếp hạng đề xuất, **không kết luận thay người**. Năm nhóm dấu hiệu:

1. Viện dẫn căn cứ pháp lý đã hết hiệu lực hoặc đã được thay thế.
2. Dùng tên cơ quan, đơn vị hành chính không còn đúng sau sắp xếp 01/7/2025.
3. Dấu hiệu vượt thẩm quyền theo lĩnh vực.
4. Thiếu thành phần bắt buộc của hồ sơ trình.
5. Sai thể thức, kỹ thuật trình bày theo Nghị định 30/2020/NĐ-CP.

**Mọi cảnh báo phải kèm lý do cụ thể và trích dẫn vị trí trong văn bản. Cảnh báo không giải
thích được lý do thì không hiển thị** — hàng rào này nằm ở `locCanhBaoHopLe()` và có kiểm thử.

Bộ quy tắc nằm trong [`data/dauhieu-canhbao.json`](data/dauhieu-canhbao.json), cũng là cấu hình.

---

## Theo dõi sau giám sát

Hồ sơ không kết thúc khi ban hành kết luận, mà kết thúc khi kiến nghị được thực hiện xong.
Mỗi kết luận tách thành các nhiệm vụ độc lập với sáu trạng thái: `hoan_thanh` ·
`hoan_thanh_mot_phan` · `chua_hoan_thanh` · `qua_han` · `khong_thuc_hien` · `chua_dap_ung_yeu_cau`.

Nhắc trước hạn 15 / 7 / 3 ngày làm việc. Quá hạn chuyển cảnh báo đỏ và khởi tạo quy trình yêu
cầu giải trình theo **Điều 40 Luật 121/2025/QH15: 15 ngày, phức tạp không quá 30 ngày** —
đây là **ngày dương lịch**, không phải ngày làm việc, và là ngoại lệ duy nhất của quy tắc chung.

Bảy bước xử lý, ghi đủ ngày tháng và văn bản từng bước: đôn đốc lần 1 → đôn đốc lần tiếp theo →
kiến nghị cấp có thẩm quyền xử lý → đưa vào phiên giải trình → đưa vào nội dung chất vấn →
tổ chức giám sát lại → báo cáo Hội đồng nhân dân xem xét.

---

## Chấm điểm thẩm định

Thang 100, năm nhóm: thẩm quyền và hình thức (20) · trình tự, thủ tục (20) · tính hợp hiến,
hợp pháp, thống nhất (30) · thể thức, kỹ thuật trình bày (10) · tính khả thi, phù hợp thực tiễn
và tổ chức thực hiện (20).

Xếp loại: Tốt ≥ 90 · Khá 75–89 · Đạt 60–74 · Chưa đạt < 60.
**Có nội dung trái pháp luật thì luôn là "Chưa đạt", bất kể tổng điểm.**

---

## Kiến trúc

GitHub Pages là **static hosting: không backend, không mã chạy phía máy chủ, không cơ sở dữ liệu.**

| Nhu cầu | Cách giải quyết |
|---|---|
| Hiển thị dữ liệu | Tệp JSON trong `data/`, tải bằng `fetch()` khi chạy |
| Ghi dữ liệu | Trình duyệt gọi thẳng GitHub Contents API, commit vào `main` |
| Đăng nhập, phân quyền | Tài khoản do quản trị cấp, mật khẩu băm PBKDF2 trong `data/nguoidung.json` |
| Quyền ghi lên kho | Mã kết nối GitHub, quản trị cấu hình một lần cho mỗi máy trạm |
| Lưu bản PDF | Commit vào `data/files/<năm>/`, tối đa 10 MB mỗi tệp |
| Phát hành | GitHub Actions build và deploy Pages sau mỗi commit |

Công nghệ: Vite · React 18 · TypeScript · Tailwind CSS · React Router (HashRouter, vì Pages
không viết lại được đường dẫn). Đọc ghi GitHub bằng `fetch` trực tiếp, không thêm SDK.

## Đăng nhập và phân quyền

Người dùng đăng nhập bằng **tài khoản do quản trị cấp**. Mật khẩu băm PBKDF2-SHA256 210.000
vòng, mỗi tài khoản một muối riêng; không lưu mật khẩu gốc.

```bash
npm run tai-khoan cap <tên đăng nhập> <mật khẩu> <vai trò> "<họ tên>" [mã đơn vị]
npm run tai-khoan doi-mat-khau <tên đăng nhập> <mật khẩu mới>
npm run tai-khoan khoa <tên đăng nhập>
npm run tai-khoan danh-sach
```

| Vai trò | Quyền |
|---|---|
| `quan_tri` | Toàn quyền, cấu hình kết nối kho, khóa và mở tài khoản |
| `thuong_truc` | Quyết định danh mục chính thức, chốt kết quả, hồ sơ giám sát |
| `ban` | Chấm điểm thẩm định, ghi bước sau giám sát, hồ sơ giám sát |
| `van_phong` | Nhập nghị quyết, lập danh mục đề xuất, ghi giải trình, hồ sơ giám sát |
| `don_vi` | Ghi giải trình của đơn vị |
| `dai_bieu` | Chỉ xem |

Tách bạch thẩm quyền được khóa bằng kiểm thử: Văn phòng lập danh mục nhưng không quyết định;
Ban chấm điểm nhưng không chốt kết quả.

### Vì sao vẫn còn mã kết nối kho

GitHub Pages là hosting tĩnh, không có backend. Ghi dữ liệu nghĩa là trình duyệt gọi thẳng
GitHub API, mà API đó bắt buộc phải có thông tin xác thực GitHub — không hệ đăng nhập thuần
client nào tạo ra được quyền ghi. Nên hệ thống tách hai tầng:

- **Đăng nhập tài khoản** — danh tính, phân quyền trong ứng dụng, ghi nhật ký ai làm gì.
- **Kết nối kho** — mã GitHub, chỉ vai trò `quan_tri` thấy và cấu hình một lần cho mỗi máy
  trạm dùng chung. Người dùng thường không nhìn thấy mục này.

Ghi được dữ liệu = **có quyền theo vai trò** và **máy trạm đã kết nối kho**.

### Những giới hạn phải nói rõ

- **Đăng nhập không phải kiểm soát truy cập thật.** Kho public nên ai cũng tải được tệp JSON,
  kể cả `data/nguoidung.json`. Đăng nhập chặn người vãng lai và phân việc trong ứng dụng, chứ
  không giấu được dữ liệu. Nội dung thực sự cần riêng tư phải chuyển sang kho private, mà
  GitHub Pages cho kho private đòi hỏi gói trả phí.
- **GS-09 (tín nhiệm) không triển khai trên kho public.** Nhóm này áp dụng chế độ bảo mật cao
  nhất; để lại đến khi có hạ tầng riêng. Trong khung nghiệp vụ nó được đánh dấu rõ.
- **GS-06 (khiếu nại, tố cáo)** chỉ được lưu số liệu tổng hợp. Không đưa nội dung đơn thư và
  thông tin cá nhân của công dân lên kho public.
- **Kho đang public.** Mọi thứ commit lên đều công khai vĩnh viễn, kể cả sau khi xóa vẫn tra
  được trong lịch sử.
- **Không có khóa ghi đồng thời.** Hai người cùng sửa một tệp thì người ghi sau nhận lỗi 409
  và phải tải lại trang. Với quy mô thí điểm, điều này chấp nhận được.
- **Các mốc ngày 20 và 25 không tự chạy.** Không có máy chủ nên phải có người mở trang và bấm.
  Trang Tổng quan hiện rõ mốc nào đã qua mà chưa làm.

---

## Chạy tại máy

```bash
npm install
npm run dev               # chạy nội bộ
npm run build             # build ra dist/
npm run preview           # xem thử bản build
npm run typecheck         # tsc --noEmit
npm run test              # Vitest
npm run lint
npm run sinh-du-lieu-mau  # sinh lại bộ dữ liệu giả lập trong data/mau/
npm run tai-khoan         # cấp, khóa, đổi mật khẩu tài khoản
```

## Cấu trúc thư mục

```
/
├─ CLAUDE.md              hướng dẫn cho Claude Code khi làm việc trên kho này
├─ src/
│  ├─ trang/              TongQuan, KhungNghiepVu, NghiQuyet, DanhMucRaSoat, ThamDinh,
│  │                      TheoDoiSauGiamSat, HoSoGiamSat, HoiDap, QuanTri
│  ├─ thanhphan/          dùng chung: BoCuc, ManHinhDangNhap, LuoiDonVi, Nhan, ThongBao…
│  ├─ dulieu/             đọc JSON, ghi qua GitHub API, xác thực và phiên làm việc
│  ├─ nghiepvu/           logic thuần: xepHangRuiRo, lapDanhMuc, chamDiem, hanXuLy,
│  │                      theoDoiNhiemVu, theoDoiDonVi, phanQuyen (+ kiểm thử)
│  └─ kieu/               định nghĩa TypeScript
├─ data/                  dữ liệu và cấu hình, xem data/README.md
├─ scripts/               bộ sinh dữ liệu giả lập
└─ .github/workflows/deploy.yml
```

## Giao diện

Điểm nhấn của sản phẩm là **bàn làm việc danh mục tháng** ở trang Danh mục rà soát: bên trái
là đề xuất chờ quyết định, mỗi dòng hiện rõ cách thức lựa chọn, điểm rủi ro và lý do; Thường
trực đưa sang phải để vào danh mục chính thức, hoặc loại ra kèm ghi chú. Nó thể hiện đúng
nguyên tắc "máy đề xuất, người quyết định".

Bổ trợ: lưới 166 ô ở trang Tổng quan, mỗi ô một xã phường, đổ màu theo số ngày kể từ lần rà
soát gần nhất — phục vụ cách thức `luan_phien`.

## Dữ liệu

Ứng dụng đọc `data/<tệp>` trước; nếu chưa có thì lùi về `data/mau/<tệp>` — bộ **dữ liệu giả
lập** để chạy thử, và giao diện hiện dải cảnh báo. Chi tiết trong
[`data/README.md`](data/README.md).

Tên và mã 166 xã, phường lấy từ danh mục chính thức
[`data/donvi_hanhchinh_thanhhoa_166.json`](data/donvi_hanhchinh_thanhhoa_166.json)
(Nghị quyết 1686/NQ-UBTVQH15 ngày 16/6/2025). **Tên đơn vị là thật; mọi số liệu còn lại —
nghị quyết, điểm số, xếp loại, nhiệm vụ sau giám sát — đều hư cấu.** Trong đó có trường hợp bị
xếp "chưa đạt · có nội dung trái pháp luật" gắn với tên một xã có thật: cân nhắc khi trình
chiếu hoặc chia sẻ ảnh màn hình tách khỏi dải cảnh báo.

> **`data/ngayle.json` cần bổ sung.** Hiện chỉ có bốn ngày nghỉ lễ theo dương lịch. Các ngày
> nghỉ theo âm lịch và ngày nghỉ bù phải cập nhật theo thông báo hằng năm. Thiếu ngày lễ thì
> mọi mốc hạn xử lý sẽ tính sớm hơn thực tế, vì hạn tính theo ngày làm việc.

## Bật GitHub Pages

Vào **Settings · Pages · Build and deployment**, đặt **Source** là **GitHub Actions**.
Workflow trong `.github/workflows/deploy.yml` chạy typecheck, kiểm thử và build trước khi
phát hành; hỏng một bước là không phát hành.

## Nhập liệu

1. Quản trị cấp tài khoản bằng `npm run tai-khoan cap`, rồi commit `data/nguoidung.json`.
2. Quản trị đăng nhập, vào **Quản trị · Kết nối kho**, dán mã GitHub fine-grained (quyền
   Contents: Read and write, chỉ cho kho này), bấm **Kiểm tra kết nối** — làm một lần cho mỗi
   máy trạm dùng chung.
3. Người dùng đăng nhập bằng tài khoản của mình; họ tên trong tài khoản được ghi vào nhật ký
   sửa danh mục và phiếu thẩm định.

Mã kết nối và phiên đăng nhập chỉ nằm trong `sessionStorage` của tab đang mở, đóng tab là mất.
Không bao giờ commit mã kết nối.

## Lộ trình

- **Giai đoạn 1 (đến 12/2026)** — khung 12 nhóm · GS-02 đầy đủ · GS-11 và GS-12 · cầu nối hai cấp.
- **Giai đoạn 2 (quý I–II/2027)** — bổ sung GS-01, GS-03, GS-04; mở cho 166 đơn vị; phân quyền đầy đủ.
- **Giai đoạn 3 (từ quý III/2027)** — bổ sung GS-05, GS-06, GS-07, GS-08; bảng chỉ số; ứng dụng
  di động; kết nối kho dữ liệu dùng chung của tỉnh. GS-09 chỉ triển khai khi có hạ tầng bảo mật riêng.
