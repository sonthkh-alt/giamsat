# Giám sát số Thanh Hóa

Hệ thống phần mềm quản lý hoạt động giám sát của cơ quan dân cử tỉnh Thanh Hóa.

- Chủ đầu tư nghiệp vụ: Thường trực Hội đồng nhân dân tỉnh Thanh Hóa
- Cơ quan thường trực: Văn phòng Đoàn đại biểu Quốc hội và Hội đồng nhân dân tỉnh
- Người dùng: Thường trực và các Ban của Hội đồng nhân dân tỉnh, đại biểu, Văn phòng,
  và Thường trực Hội đồng nhân dân của 166 xã, phường

Trang chạy tại **https://sonthkh-alt.github.io/giamsat/**

---

## Hệ thống làm được gì

**1. Cơ sở dữ liệu nghị quyết cấp xã.** Nhập nghị quyết, đính kèm bản PDF, tra cứu và lọc
theo đơn vị, lĩnh vực, loại văn bản, tình trạng hiệu lực.

**2. Rút thăm kiểm tra ngẫu nhiên.** Mỗi tuần rút một số nghị quyết để thẩm định. Việc rút
thăm **kiểm chứng được**: xem mục dưới.

**3. Thẩm định và chốt kết quả.** Phiếu chấm điểm thang 100 chia năm nhóm, ghi giải trình của
đơn vị, chốt kết quả sau khi hết thời hạn giải trình.

**4. Cầu nối tỉnh – xã.** Hỏi đáp nghiệp vụ, thư viện văn bản mẫu, bảng tin điều hành.

**5. Lưới theo dõi 166 ô.** Trang tổng quan mở đầu bằng lưới mỗi ô một xã, phường, đổ màu
theo số ngày kể từ lần kiểm tra gần nhất — nhìn một cái là thấy đơn vị nào đang bị bỏ quên.

Theo dõi kiến nghị sau giám sát hiện chỉ ở mức xem, thuộc giai đoạn 3 của lộ trình.

---

## Vì sao tin được rằng rút thăm là khách quan

Trang web tĩnh không có máy chủ đáng tin, nên tính khách quan đến từ **tính tái lập**:

- Không dùng `Math.random()`. Dùng bộ sinh số mulberry32 có hạt cố định, viết trong
  [`src/nghiepvu/rutTham.ts`](src/nghiepvu/rutTham.ts).
- Seed theo công thức công bố trước: `<năm>-W<tuần ISO>-<mã muối>`, mã muối nằm trong
  [`data/cauhinh.json`](data/cauhinh.json) và không được đổi giữa chừng.
- Mỗi đợt lưu lại seed, toàn bộ trọng số, **ảnh chụp danh sách ứng viên đầu vào** và kết quả
  vào `data/dotkiemtra/<kỳ>.json`. Kho public nên tệp này nằm cố định trong lịch sử Git.
- Trang Rút thăm có nút **“Chạy lại để kiểm chứng”**: bất kỳ ai cũng tính lại và ra đúng kết
  quả cũ. Nếu ai đó sửa tay danh sách trúng, việc tính lại sẽ báo không khớp.
- Kiểm thử `src/nghiepvu/duLieuMau.test.ts` chạy lại chính các đợt có trong kho ở mỗi lần CI,
  nên việc sửa lén sẽ làm hỏng build.

Trọng số ưu tiên: đơn vị chưa kiểm tra trong 6 tháng ×3 · lĩnh vực ngân sách, đầu tư công,
đất đai, phí lệ phí, tổ chức bộ máy, chế độ chính sách ×2 · đơn vị kỳ trước “chưa đạt” ×2.
Các hệ số nhân dồn với nhau.

---

## Kiến trúc

GitHub Pages là **hosting tĩnh: không backend, không mã chạy phía máy chủ, không cơ sở dữ liệu.**

| Nhu cầu | Cách giải quyết |
|---|---|
| Hiển thị dữ liệu | Tệp JSON trong `data/`, tải bằng `fetch()` khi chạy |
| Ghi dữ liệu | Trình duyệt gọi thẳng GitHub Contents API, commit vào `main` |
| Xác thực người ghi | Fine-grained PAT người dùng tự dán, lưu ở `sessionStorage` |
| Lưu bản PDF nghị quyết | Commit vào `data/files/<năm>/`, tối đa 10 MB mỗi tệp |
| Phát hành | GitHub Actions build và deploy Pages sau mỗi commit |

Công nghệ: Vite · React 18 · TypeScript · Tailwind CSS · React Router (HashRouter, vì Pages
không viết lại được đường dẫn). Đọc ghi GitHub bằng `fetch` trực tiếp, không thêm SDK.

### Những giới hạn phải nói rõ

- **Không có phân quyền thật.** Việc ẩn kết quả chưa chốt khỏi người chưa dán mã truy cập chỉ
  là quy ước hiển thị: ai cũng đọc thẳng được tệp JSON trong kho. Nội dung thực sự cần riêng
  tư phải chuyển sang kho private, nhưng GitHub Pages cho kho private đòi hỏi gói trả phí.
- **Kho đang public.** Mọi thứ commit lên đều công khai vĩnh viễn, kể cả sau khi xóa vẫn tra
  được trong lịch sử. Không đưa lên thông tin cá nhân của công dân, nội dung đơn thư, hay
  thông tin thuộc phạm vi bí mật nhà nước.
- **Không có khóa ghi đồng thời.** Hai người cùng sửa một tệp thì người ghi sau nhận lỗi 409
  và phải tải lại trang. Với quy mô thí điểm 15 đơn vị, điều này chấp nhận được.
- **Rút thăm không tự chạy 8h00 thứ Hai.** Không có máy chủ nên phải có người mở trang và bấm
  ghi đợt. Kết quả chỉ phụ thuộc seed nên bấm lúc nào trong tuần cũng ra cùng danh sách.

---

## Chạy tại máy

```bash
npm install
npm run dev        # chạy nội bộ
npm run build      # build ra dist/
npm run preview    # xem thử bản build
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
npm run lint
```

## Cấu trúc thư mục

```
/
├─ CLAUDE.md              hướng dẫn cho Claude Code khi làm việc trên kho này
├─ index.html
├─ vite.config.ts
├─ src/
│  ├─ trang/              TongQuan, NghiQuyet, RutTham, ThamDinh, KienNghi, HoiDap, QuanTri
│  ├─ thanhphan/          thành phần dùng chung: BoCuc, LuoiDonVi, Nhan, ThongBao…
│  ├─ dulieu/             đọc JSON, ghi qua GitHub API, phiên làm việc
│  ├─ nghiepvu/           logic thuần: rutTham, chamDiem, hanXuLy, ungVienRutTham (+ kiểm thử)
│  └─ kieu/               định nghĩa TypeScript
├─ data/                  dữ liệu, xem data/README.md
└─ .github/workflows/deploy.yml
```

## Dữ liệu

Ứng dụng đọc `data/<tệp>` trước; nếu chưa có thì lùi về `data/mau/<tệp>` — bộ **dữ liệu giả
lập** để chạy thử, và giao diện hiện dải cảnh báo. Chi tiết trong
[`data/README.md`](data/README.md).

Bộ dữ liệu giả lập gồm 166 đơn vị hư cấu mang tên “Xã Mẫu 001”, “Phường Mẫu 01”… **Không có
số liệu thật của bất kỳ xã, phường cụ thể nào.**

> **`data/ngayle.json` cần bổ sung.** Hiện chỉ có bốn ngày nghỉ lễ theo dương lịch. Các ngày
> nghỉ theo âm lịch và ngày nghỉ bù phải cập nhật theo thông báo hằng năm. Thiếu ngày lễ thì
> mọi mốc hạn xử lý sẽ tính sớm hơn thực tế, vì hạn tính theo ngày làm việc.

## Bật GitHub Pages

Vào **Settings · Pages · Build and deployment**, đặt **Source** là **GitHub Actions**.
Workflow trong `.github/workflows/deploy.yml` chạy typecheck, kiểm thử và build trước khi
phát hành; hỏng một bước là không phát hành.

## Nhập liệu

1. Tạo fine-grained PAT chỉ cho kho này, quyền **Contents: Read and write**, hạn dùng ngắn.
2. Mở trang **Quản trị**, dán mã, bấm **Kiểm tra quyền ghi**.
3. Mã chỉ nằm trong `sessionStorage` của tab đang mở, đóng tab là mất. Không bao giờ commit mã.

## Quy tắc nghiệp vụ không được làm sai

- **Rút thăm phải kiểm chứng được** — xem mục trên.
- **Chấm điểm.** Thang 100: thẩm quyền và hình thức 20 · trình tự thủ tục 20 · nội dung hợp
  pháp 30 · thể thức trình bày 10 · khả thi thực tiễn 20. Xếp loại: Tốt ≥ 90 · Khá 75–89 ·
  Đạt 60–74 · Chưa đạt < 60. **Có nội dung trái pháp luật thì luôn là “Chưa đạt”, bất kể tổng điểm.**
- **Hạn xử lý.** Thẩm định 5 ngày làm việc · giải trình 5 ngày làm việc · nhắc kiến nghị trước
  hạn 15, 7, 3 ngày làm việc, quá hạn chuyển cảnh báo đỏ. Tính theo ngày làm việc, trừ thứ Bảy,
  Chủ nhật và ngày nghỉ lễ trong `data/ngayle.json`. Mọi mốc thời gian theo giờ `Asia/Ho_Chi_Minh`.
