# Thư mục dữ liệu

Trang chạy trên GitHub Pages nên không có cơ sở dữ liệu. Toàn bộ dữ liệu nằm trong các tệp
JSON ở đây, tải bằng `fetch()` khi mở trang và ghi lại bằng GitHub Contents API.

## Cách tra dữ liệu

Với mỗi tệp, ứng dụng đọc `data/<tên tệp>` trước. Nếu tệp đó chưa có (mã 404) thì lùi về
`data/mau/<tên tệp>` — bộ **dữ liệu giả lập** phục vụ chạy thử. Khi đang chạy trên dữ liệu
giả lập, giao diện hiện một dải cảnh báo ở đầu trang.

Muốn chuyển sang dữ liệu thật: tạo tệp tương ứng trong `data/` (không nằm trong `mau/`).
Tệp thật luôn được ưu tiên.

## Danh mục tệp

| Tệp | Nội dung | Hiện có ở đâu |
|---|---|---|
| `cauhinh.json` | Mã muối rút thăm, tên kho, năm làm việc | `data/` — thật |
| `tieuchi.json` | Năm nhóm tiêu chí chấm điểm và chi tiết từng tiêu chí | `data/` — thật |
| `ngayle.json` | Ngày nghỉ lễ, dùng để tính ngày làm việc | `data/` — thật, **cần bổ sung** |
| `donvi_hanhchinh_thanhhoa_166.json` | Danh mục 166 xã, phường — nguồn gốc của tên đơn vị | `data/` — thật |
| `donvi.json` | Danh sách xã, phường | `data/mau/` — giả lập |
| `nghiquyet/<năm>.json` | Nghị quyết đã ban hành | `data/mau/` — giả lập |
| `dotkiemtra/muc-luc.json` | Danh sách mã kỳ đã rút thăm | `data/mau/` — giả lập |
| `dotkiemtra/<kỳ>.json` | Một đợt rút thăm: seed, trọng số, ứng viên, kết quả | `data/mau/` — giả lập |
| `ketqua/<năm>.json` | Phiếu thẩm định, giải trình, trạng thái chốt | `data/mau/` — giả lập |
| `kiennghi/<năm>.json` | Kiến nghị sau giám sát | `data/mau/` — giả lập |
| `hoidap.json` | Ngân hàng hỏi đáp nghiệp vụ | `data/mau/` — giả lập |
| `vanbanmau.json` | Danh mục thư viện văn bản mẫu | `data/mau/` — giả lập |
| `bangtin.json` | Bảng tin điều hành | `data/mau/` — giả lập |
| `files/<năm>/…` | Bản PDF nghị quyết, tối đa 10 MB mỗi tệp | chưa có |

## Danh mục đơn vị hành chính

`donvi_hanhchinh_thanhhoa_166.json` là danh mục chính thức 166 xã, phường (19 phường,
147 xã) theo Nghị quyết 1686/NQ-UBTVQH15 ngày 16/6/2025, kèm mã đơn vị hành chính 5 chữ số
theo danh mục của Tổng cục Thống kê. Đây là **nguồn duy nhất** của tên và mã đơn vị; không
gõ tay tên xã, phường ở chỗ khác.

Trường `vung` trong danh mục nguồn để trống. Hệ thống để nguyên là `chua_phan_loai` thay vì
tự gán đồng bằng / ven biển / miền núi — không bịa đặc điểm cho đơn vị có thật. Khi có văn
bản phân vùng chính thức thì cập nhật lại.

## Dữ liệu giả lập trong `mau/`

`data/mau/` dùng **tên xã, phường thật** lấy từ danh mục trên, nhưng **mọi số liệu đều hư
cấu**: nghị quyết, điểm số, xếp loại, kiến nghị. Giao diện hiện dải cảnh báo nói rõ điều này.

> Kết quả chấm điểm giả lập có gắn với tên đơn vị có thật, trong đó có một trường hợp bị xếp
> "chưa đạt" vì "có nội dung trái pháp luật". **Ảnh chụp màn hình tách khỏi dải cảnh báo sẽ
> thành lời cáo buộc sai về một xã có thật.** Cân nhắc kỹ khi trình chiếu hoặc chia sẻ.

Không được đưa số liệu thật vào thư mục `mau/`.

Toàn bộ bộ dữ liệu này sinh lại được:

```bash
npm run sinh-du-lieu-mau
```

Script `scripts/sinh-du-lieu-mau.mjs` dùng bộ sinh số có seed cố định nên chạy bao nhiêu lần
cũng ra đúng kết quả cũ. Đợt rút thăm mẫu `dotkiemtra/2026-W30.json` được sinh bằng đúng
thuật toán trong `src/nghiepvu/rutTham.ts`, nên nút **"Chạy lại để kiểm chứng"** trên trang
Rút thăm báo khớp.

## Chuyển sang chạy thật

Tạo `data/donvi.json` từ danh mục chính thức — giữ nguyên `ma`, `maDvhc`, `ten`, `loai`, đặt
`lanKiemTraGanNhat` là `null` cho mọi đơn vị vì chưa đơn vị nào được kiểm tra. Tệp này ưu tiên
hơn `data/mau/donvi.json`. Sau đó nhập nghị quyết thật qua trang Nghị quyết; khi đủ các tệp
thật thì dải cảnh báo tự tắt.

## `ngayle.json` cần bổ sung hằng năm

Tệp đang có bốn ngày nghỉ lễ theo dương lịch. Các ngày nghỉ theo âm lịch (Tết Nguyên đán,
Giỗ Tổ Hùng Vương) và các ngày nghỉ bù phải cập nhật theo thông báo hằng năm của cơ quan
có thẩm quyền. **Thiếu ngày lễ thì mọi mốc hạn xử lý sẽ tính sớm hơn thực tế**, vì hạn được
tính theo ngày làm việc.

## Quy tắc bắt buộc

- Kho đang public: mọi thứ commit lên đều công khai vĩnh viễn.
- Không đưa vào đây thông tin cá nhân của công dân, nội dung đơn thư, hay thông tin thuộc
  phạm vi bí mật nhà nước.
- Không commit mã truy cập, token, mật khẩu — kể cả trong tệp ví dụ.
- Kết quả chấm điểm chỉ để `trangThai: "da_chot"` sau khi đã hết thời hạn giải trình 5 ngày
  làm việc. Trước đó để `"chua_chot"`.
