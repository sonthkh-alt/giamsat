// Sinh bộ dữ liệu giả lập trong data/mau/.
//
//     node scripts/sinh-du-lieu-mau.mjs
//
// Chạy lại lệnh này luôn cho ra đúng bộ dữ liệu cũ: mọi chỗ ngẫu nhiên đều dùng
// bộ sinh số có seed cố định, không dùng Math.random().
//
// Thuật toán rút thăm ở đây phải trùng khít với src/nghiepvu/rutTham.ts, nếu
// không nút "Chạy lại để kiểm chứng" trên trang sẽ báo không khớp. Kiểm thử
// src/nghiepvu/duLieuMau.test.ts canh đúng điều đó.
//
// TÊN ĐƠN VỊ LÀ TÊN THẬT, lấy từ data/donvi_hanhchinh_thanhhoa_166.json.
// Mọi thứ còn lại — nghị quyết, điểm số, kiến nghị — đều là số liệu hư cấu.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const TEP_NGUON_DON_VI = 'data/donvi_hanhchinh_thanhhoa_166.json';
const MA_MUOI = 'gsts-2026-thidiem';
const KY = '2026-W30';
const NGAY_RUT = '2026-07-20';
const SO_RUT = 5;

const NGAY_LE = ['2026-01-01', '2026-04-30', '2026-05-01', '2026-09-02'];

// --- tiện ích ngày ---------------------------------------------------------
const MOT_NGAY = 86400000;
const taoNgay = (iso) => new Date(`${iso}T00:00:00Z`);
const sangISO = (d) => d.toISOString().slice(0, 10);
const themNgay = (iso, n) => sangISO(new Date(taoNgay(iso).getTime() + n * MOT_NGAY));
const soNgayDuongLich = (a, b) => Math.round((taoNgay(b) - taoNgay(a)) / MOT_NGAY);
const laCuoiTuan = (iso) => [0, 6].includes(taoNgay(iso).getUTCDay());
function congNgayLamViec(tuNgay, so) {
  let iso = tuNgay;
  let conLai = so;
  while (conLai > 0) {
    iso = themNgay(iso, 1);
    if (!laCuoiTuan(iso) && !NGAY_LE.includes(iso)) conLai -= 1;
  }
  return iso;
}

// --- PRNG ------------------------------------------------------------------
function bam32(chuoi) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < chuoi.length; i += 1) {
    h ^= chuoi.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(hat) {
  let a = hat >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- trọng số --------------------------------------------------------------
const LINH_VUC_UU_TIEN = new Set([
  'ngan_sach',
  'dau_tu_cong',
  'dat_dai',
  'phi_le_phi',
  'to_chuc_bo_may',
  'che_do_chinh_sach',
]);
const THAM_SO = {
  coBan: 1,
  chuaKiemTraSauThang: 3,
  linhVucUuTien: 2,
  kyTruocChuaDat: 2,
};
function tinhTrongSo(uv, ngayThamChieu) {
  let ts = THAM_SO.coBan;
  if (uv.lanKiemTraGanNhat === null || soNgayDuongLich(uv.lanKiemTraGanNhat, ngayThamChieu) > 183) {
    ts *= THAM_SO.chuaKiemTraSauThang;
  }
  if (LINH_VUC_UU_TIEN.has(uv.linhVuc)) ts *= THAM_SO.linhVucUuTien;
  if (uv.kyTruocChuaDat) ts *= THAM_SO.kyTruocChuaDat;
  return ts;
}

function rutTham(ungVien, soLuong, seed, ngayThamChieu) {
  const sinh = mulberry32(bam32(seed));
  const daSapXep = [...ungVien].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const conLai = daSapXep
    .map((uv) => ({ id: uv.id, trongSo: tinhTrongSo(uv, ngayThamChieu) }))
    .filter((t) => t.trongSo > 0);
  const trung = [];
  const canRut = Math.min(soLuong, conLai.length);
  for (let luot = 1; luot <= canRut; luot += 1) {
    const tong = conLai.reduce((s, t) => s + t.trongSo, 0);
    const moc = sinh() * tong;
    let luyKe = 0;
    let viTri = conLai.length - 1;
    for (let i = 0; i < conLai.length; i += 1) {
      luyKe += conLai[i].trongSo;
      if (moc < luyKe) {
        viTri = i;
        break;
      }
    }
    trung.push(conLai[viTri].id);
    conLai.splice(viTri, 1);
  }
  return trung;
}

// --- sinh đơn vị -----------------------------------------------------------
// Tên và mã đơn vị hành chính lấy nguyên từ danh mục chính thức. Thứ tự trong
// tệp nguồn là 19 phường rồi 147 xã, và mã nội bộ TH-xxx bám theo thứ tự đó nên
// giữ nguyên qua mọi lần sinh lại.
const nguonDonVi = JSON.parse(readFileSync(resolve(GOC, TEP_NGUON_DON_VI), 'utf8'));
const danhMuc = nguonDonVi.don_vi;
if (danhMuc.length !== 166) {
  throw new Error(`${TEP_NGUON_DON_VI} phải có đúng 166 đơn vị, đang có ${danhMuc.length}.`);
}

const rnd = mulberry32(bam32('du-lieu-gia-lap-166-don-vi'));

const donVi = danhMuc.map((goc, i) => {
  const r = rnd();
  let lanKiemTra = null;
  if (r > 0.32) {
    // trải đều từ 2025-08-01 đến 2026-07-10
    const lech = Math.floor(rnd() * 344);
    lanKiemTra = themNgay('2025-08-01', lech);
  }
  return {
    ma: `TH-${String(i + 1).padStart(3, '0')}`,
    maDvhc: goc.ma_dvhc,
    ten: goc.ten_day_du,
    loai: goc.loai === 'Phường' ? 'phuong' : 'xa',
    // Danh mục nguồn để trống cột vùng. Không tự gán vùng cho xã, phường có thật.
    vung: 'chua_phan_loai',
    lanKiemTraGanNhat: lanKiemTra,
  };
});

// --- sinh nghị quyết -------------------------------------------------------
const LINH_VUC = [
  'ngan_sach',
  'dau_tu_cong',
  'dat_dai',
  'phi_le_phi',
  'to_chuc_bo_may',
  'che_do_chinh_sach',
  'khac',
];
const TRICH_YEU = [
  'Về việc phê chuẩn quyết toán ngân sách xã năm 2025',
  'Về kế hoạch đầu tư công trung hạn giai đoạn 2026 - 2030',
  'Về việc thông qua quy hoạch sử dụng đất đến năm 2030',
  'Về mức thu, miễn, giảm và quản lý sử dụng phí, lệ phí thuộc thẩm quyền',
  'Về việc thành lập, tổ chức lại các cơ quan chuyên môn thuộc Ủy ban nhân dân',
  'Về chính sách hỗ trợ phát triển sản xuất nông nghiệp trên địa bàn',
  'Về chương trình giám sát của Hội đồng nhân dân năm 2026',
  'Về việc điều chỉnh dự toán thu, chi ngân sách năm 2026',
  'Về nhiệm vụ phát triển kinh tế - xã hội, quốc phòng - an ninh năm 2026',
  'Về việc thông qua đề án xây dựng nông thôn mới nâng cao',
];
const KY_HOP = ['Kỳ họp thứ 2', 'Kỳ họp thứ 3', 'Kỳ họp thứ 4', 'Kỳ họp chuyên đề lần thứ 1'];

const rndNQ = mulberry32(bam32('du-lieu-gia-lap-nghi-quyet'));
const nghiQuyet = [];
const demTheoDonVi = new Map();
for (let i = 0; i < 96; i += 1) {
  const chiSo = Math.floor(rndNQ() * donVi.length);
  const dv = donVi[chiSo];
  const so = (demTheoDonVi.get(dv.ma) ?? 0) + 1;
  demTheoDonVi.set(dv.ma, so);
  const ngayBanHanh = themNgay('2026-01-06', Math.floor(rndNQ() * 190));
  const r = rndNQ();
  const hieuLuc = r > 0.94 ? 'het_hieu_luc' : r > 0.9 ? 'da_thay_the' : 'con_hieu_luc';
  const linhVuc = LINH_VUC[Math.floor(rndNQ() * LINH_VUC.length)];
  nghiQuyet.push({
    id: `${dv.ma}-${so}-2026`,
    maDonVi: dv.ma,
    so: String(so),
    kyHieu: 'NQ-HĐND',
    ngayBanHanh,
    kyHop: KY_HOP[Math.floor(rndNQ() * KY_HOP.length)],
    loai: rndNQ() > 0.35 ? 'quy_pham' : 'ca_biet',
    linhVuc,
    trichYeu: TRICH_YEU[Math.floor(rndNQ() * TRICH_YEU.length)],
    hieuLuc,
    tepDinhKem: [],
    ngayCapNhat: themNgay(ngayBanHanh, 2),
  });
}
nghiQuyet.sort((a, b) => (a.ngayBanHanh < b.ngayBanHanh ? 1 : -1));

// --- đợt kiểm tra 2026-W30 -------------------------------------------------
const donViTheoMa = new Map(donVi.map((d) => [d.ma, d]));
const anhChupUngVien = nghiQuyet
  .filter((nq) => nq.hieuLuc === 'con_hieu_luc')
  .map((nq) => ({
    id: nq.id,
    maDonVi: nq.maDonVi,
    linhVuc: nq.linhVuc,
    lanKiemTraGanNhat: donViTheoMa.get(nq.maDonVi).lanKiemTraGanNhat,
    kyTruocChuaDat: false,
  }))
  .sort((a, b) => (a.id < b.id ? -1 : 1));

const seed = `${KY}-${MA_MUOI}`;
const danhSachTrung = rutTham(anhChupUngVien, SO_RUT, seed, NGAY_RUT);

const NGUOI = ['Lê Thị B', 'Trần Văn C', 'Phạm Thị D'];
const nguoiPhanCong = {};
danhSachTrung.forEach((id, i) => {
  nguoiPhanCong[id] = NGUOI[i % NGUOI.length];
});

const dotKiemTra = {
  ky: KY,
  ngayRutTham: NGAY_RUT,
  seed,
  thamSoTrongSo: THAM_SO,
  danhSachTrung,
  nguoiPhanCong,
  ungVien: anhChupUngVien.map((u) => u.id),
  anhChupUngVien,
  soLuongCanRut: SO_RUT,
};

// --- kết quả thẩm định -----------------------------------------------------
const HAN_GIAI_TRINH = congNgayLamViec('2026-07-22', 5); // 2026-07-29
const BANG_DIEM = [
  {
    diemNhom: {
      thamQuyenHinhThuc: 20,
      trinhTuThuTuc: 18,
      noiDungHopPhap: 28,
      theThucTrinhBay: 9,
      khaThiThucTien: 18,
    },
    traiPhapLuat: false,
    nhanXet:
      'Hồ sơ đầy đủ, trình tự đúng quy định. Còn một số lỗi nhỏ về kỹ thuật trình bày ở phần căn cứ ban hành.',
    trangThai: 'da_chot',
  },
  {
    diemNhom: {
      thamQuyenHinhThuc: 18,
      trinhTuThuTuc: 14,
      noiDungHopPhap: 24,
      theThucTrinhBay: 8,
      khaThiThucTien: 15,
    },
    traiPhapLuat: false,
    nhanXet:
      'Thiếu văn bản lấy ý kiến đối tượng chịu tác động. Đề nghị bổ sung vào hồ sơ lưu và rút kinh nghiệm cho các nghị quyết sau.',
    trangThai: 'da_chot',
  },
  {
    diemNhom: {
      thamQuyenHinhThuc: 14,
      trinhTuThuTuc: 12,
      noiDungHopPhap: 18,
      theThucTrinhBay: 7,
      khaThiThucTien: 12,
    },
    traiPhapLuat: true,
    nhanXet:
      'Nghị quyết quy định mức thu vượt khung do văn bản cấp trên ấn định. Nội dung này trái quy định hiện hành, đề nghị đơn vị sửa đổi và báo cáo kết quả.',
    trangThai: 'da_chot',
  },
  {
    diemNhom: {
      thamQuyenHinhThuc: 19,
      trinhTuThuTuc: 17,
      noiDungHopPhap: 26,
      theThucTrinhBay: 9,
      khaThiThucTien: 16,
    },
    traiPhapLuat: false,
    nhanXet:
      'Nội dung phù hợp thẩm quyền. Cần làm rõ nguồn kinh phí bảo đảm thực hiện trong năm ngân sách.',
    trangThai: 'chua_chot',
    giaiTrinh:
      'Đơn vị đã bố trí nguồn từ nguồn tăng thu năm 2025 chuyển sang, có biểu chi tiết kèm theo.',
  },
  {
    diemNhom: {
      thamQuyenHinhThuc: 20,
      trinhTuThuTuc: 19,
      noiDungHopPhap: 29,
      theThucTrinhBay: 10,
      khaThiThucTien: 19,
    },
    traiPhapLuat: false,
    nhanXet: 'Hồ sơ và nội dung đạt yêu cầu, không có kiến nghị sửa đổi.',
    trangThai: 'chua_chot',
    giaiTrinh: null,
  },
];

function xepLoai(tong, trai) {
  if (trai) return 'chua_dat';
  if (tong >= 90) return 'tot';
  if (tong >= 75) return 'kha';
  if (tong >= 60) return 'dat';
  return 'chua_dat';
}

const ketQua = danhSachTrung.map((id, i) => {
  const mau = BANG_DIEM[i % BANG_DIEM.length];
  const tong = Object.values(mau.diemNhom).reduce((a, b) => a + b, 0);
  return {
    idNghiQuyet: id,
    ky: KY,
    diemNhom: mau.diemNhom,
    tongDiem: tong,
    xepLoai: xepLoai(tong, mau.traiPhapLuat),
    coNoiDungTraiPhapLuat: mau.traiPhapLuat,
    nhanXet: mau.nhanXet,
    nguoiThamDinh: nguoiPhanCong[id],
    hanGiaiTrinh: HAN_GIAI_TRINH,
    giaiTrinh: mau.giaiTrinh ?? null,
    trangThai: mau.trangThai,
  };
});

// Đơn vị có kết quả ĐÃ CHỐT thì coi như vừa được kiểm tra trong đợt này.
const nghiQuyetTheoId = new Map(nghiQuyet.map((nq) => [nq.id, nq]));
for (const kq of ketQua) {
  if (kq.trangThai !== 'da_chot') continue;
  const dv = donViTheoMa.get(nghiQuyetTheoId.get(kq.idNghiQuyet).maDonVi);
  if (dv && (dv.lanKiemTraGanNhat === null || dv.lanKiemTraGanNhat < NGAY_RUT)) {
    dv.lanKiemTraGanNhat = NGAY_RUT;
  }
}

// --- kiến nghị sau giám sát ------------------------------------------------
// Cơ quan chịu trách nhiệm gắn với đơn vị có thật, chọn theo chỉ số cố định
// để chạy lại vẫn ra cùng kết quả.
const kienNghi = [
  {
    id: 'KN-2026-001',
    nguonGiamSat: 'Giám sát chuyên đề về quản lý đất công ích, tháng 4/2026',
    noiDung:
      'Rà soát, lập lại hồ sơ quản lý toàn bộ diện tích đất công ích trên địa bàn, xử lý dứt điểm các trường hợp cho thuê không đúng thẩm quyền.',
    coQuanChiuTrachNhiem: `Ủy ban nhân dân ${donVi[41].ten}`,
    hanThucHien: '2026-07-15',
    trangThai: 'dang_thuc_hien',
    minhChung: [],
    ngayXacNhan: null,
  },
  {
    id: 'KN-2026-002',
    nguonGiamSat: 'Giám sát việc thực hiện nghị quyết về đầu tư công, tháng 5/2026',
    noiDung:
      'Báo cáo tiến độ giải ngân các công trình khởi công mới, nêu rõ nguyên nhân chậm và giải pháp khắc phục.',
    coQuanChiuTrachNhiem: `Ủy ban nhân dân ${donVi[87].ten}`,
    hanThucHien: '2026-08-14',
    trangThai: 'chua_thuc_hien',
    minhChung: [],
    ngayXacNhan: null,
  },
  {
    id: 'KN-2026-003',
    nguonGiamSat: 'Giám sát chuyên đề về chế độ chính sách người có công, tháng 3/2026',
    noiDung:
      'Chi trả bổ sung phần còn thiếu cho các đối tượng bị áp sai mức hưởng, hoàn thành trong quý II/2026.',
    coQuanChiuTrachNhiem: `Ủy ban nhân dân ${donVi[123].ten}`,
    hanThucHien: '2026-06-30',
    trangThai: 'da_hoan_thanh',
    minhChung: [],
    ngayXacNhan: '2026-06-24',
  },
  {
    id: 'KN-2026-004',
    nguonGiamSat: 'Giám sát việc giải quyết ý kiến cử tri, tháng 2/2026',
    noiDung:
      'Trả lời bằng văn bản các ý kiến cử tri còn tồn đọng từ kỳ họp trước, gửi Thường trực Hội đồng nhân dân để theo dõi.',
    coQuanChiuTrachNhiem: `Ủy ban nhân dân ${donVi[9].ten}`,
    hanThucHien: '2026-08-31',
    trangThai: 'dang_thuc_hien',
    minhChung: [],
    ngayXacNhan: null,
  },
];

// --- hỏi đáp, văn bản mẫu, bảng tin ---------------------------------------
const hoiDap = [
  {
    id: 'HD-001',
    cauHoi: 'Nghị quyết của Hội đồng nhân dân cấp xã khi nào là văn bản quy phạm pháp luật?',
    traLoi:
      'Khi nghị quyết chứa quy tắc xử sự chung, có hiệu lực bắt buộc chung, được áp dụng lặp đi lặp lại đối với cơ quan, tổ chức, cá nhân trên địa bàn. Nghị quyết chỉ giải quyết một vụ việc cụ thể, áp dụng một lần cho đối tượng xác định là nghị quyết cá biệt và không phải làm theo trình tự ban hành văn bản quy phạm pháp luật.',
    chuDe: 'Phân loại văn bản',
    canCuPhapLy: ['Luật Ban hành văn bản quy phạm pháp luật'],
    ngayCapNhat: '2026-03-10',
  },
  {
    id: 'HD-002',
    cauHoi: 'Hồ sơ trình nghị quyết quy phạm pháp luật gồm những gì?',
    traLoi:
      'Tối thiểu gồm: tờ trình, dự thảo nghị quyết, bản tổng hợp và tiếp thu ý kiến của đối tượng chịu tác động, báo cáo thẩm tra của Ban của Hội đồng nhân dân, và các tài liệu liên quan khác. Thiếu bản tổng hợp ý kiến là lỗi bị trừ điểm nhiều nhất ở nhóm trình tự, thủ tục.',
    chuDe: 'Trình tự, thủ tục',
    canCuPhapLy: ['Luật Ban hành văn bản quy phạm pháp luật'],
    ngayCapNhat: '2026-03-10',
  },
  {
    id: 'HD-003',
    cauHoi:
      'Văn bản quy phạm pháp luật của Hội đồng nhân dân, Ủy ban nhân dân cấp huyện cũ còn hiệu lực đến bao giờ?',
    traLoi:
      'Đến hết ngày 28/02/2027. Trong thời gian này, Hội đồng nhân dân cấp xã cần rà soát và ban hành nghị quyết thay thế đối với những nội dung còn cần thiết, tránh khoảng trống pháp lý sau mốc trên.',
    chuDe: 'Chuyển tiếp chính quyền hai cấp',
    canCuPhapLy: ['Quy định chuyển tiếp về hiệu lực văn bản khi tổ chức chính quyền địa phương hai cấp'],
    ngayCapNhat: '2026-04-02',
  },
  {
    id: 'HD-004',
    cauHoi: 'Đơn vị không đồng ý với kết quả chấm điểm thì làm thế nào?',
    traLoi:
      'Đơn vị có 5 ngày làm việc kể từ ngày nhận kết quả để gửi giải trình. Giải trình được ghi vào phiếu thẩm định và xem xét trước khi chốt kết quả. Sau khi chốt, kết quả mới được công bố công khai.',
    chuDe: 'Thẩm định và giải trình',
    canCuPhapLy: ['Quy chế kiểm tra ngẫu nhiên nghị quyết Hội đồng nhân dân cấp xã'],
    ngayCapNhat: '2026-05-18',
  },
  {
    id: 'HD-005',
    cauHoi: 'Vì sao tin được rằng việc rút thăm là khách quan?',
    traLoi:
      'Vì rút thăm không dùng số ngẫu nhiên của máy mà dùng bộ sinh số có seed cố định, công thức seed là "<năm>-W<tuần ISO>-<mã muối>" với mã muối công bố trước. Toàn bộ danh sách ứng viên đầu vào, trọng số và kết quả được lưu vào kho công khai. Bất kỳ ai bấm nút "Chạy lại để kiểm chứng" cũng tính ra đúng kết quả cũ; nếu ai đó sửa danh sách trúng thì việc tính lại sẽ báo không khớp.',
    chuDe: 'Rút thăm',
    canCuPhapLy: ['Quy chế kiểm tra ngẫu nhiên nghị quyết Hội đồng nhân dân cấp xã'],
    ngayCapNhat: '2026-06-01',
  },
];

const vanBanMau = [
  {
    id: 'VBM-001',
    ten: 'Mẫu nghị quyết quy phạm pháp luật của Hội đồng nhân dân cấp xã',
    moTa: 'Bố cục và thể thức theo Nghị định 30/2020/NĐ-CP, kèm chú thích từng phần.',
    duongDan: 'data/mau/vanban/mau-nghi-quyet-quy-pham.md',
    ngayCapNhat: '2026-03-10',
  },
  {
    id: 'VBM-002',
    ten: 'Mẫu tờ trình dự thảo nghị quyết',
    moTa: 'Dùng khi Ủy ban nhân dân trình dự thảo nghị quyết ra kỳ họp.',
    duongDan: 'data/mau/vanban/mau-to-trinh.md',
    ngayCapNhat: '2026-03-10',
  },
  {
    id: 'VBM-003',
    ten: 'Mẫu báo cáo thẩm tra của Ban của Hội đồng nhân dân',
    moTa: 'Khung nội dung báo cáo thẩm tra theo năm nhóm tiêu chí chấm điểm.',
    duongDan: 'data/mau/vanban/mau-bao-cao-tham-tra.md',
    ngayCapNhat: '2026-04-05',
  },
];

const banTin = [
  {
    id: 'BT-001',
    tieuDe: 'Bắt đầu thí điểm kiểm tra ngẫu nhiên nghị quyết cấp xã',
    noiDung:
      'Từ tuần này, hệ thống rút thăm 5 nghị quyết mỗi tuần vào 8h00 sáng thứ Hai. Các đơn vị chuẩn bị hồ sơ để gửi khi được yêu cầu.',
    ngayDang: '2026-07-20',
    mucDo: 'quan_trong',
  },
  {
    id: 'BT-002',
    tieuDe: 'Lưu ý về mốc 28/02/2027',
    noiDung:
      'Đề nghị các đơn vị rà soát những nội dung đang áp dụng theo văn bản của cấp huyện cũ và chủ động xây dựng nghị quyết thay thế.',
    ngayDang: '2026-07-06',
    mucDo: 'quan_trong',
  },
  {
    id: 'BT-003',
    tieuDe: 'Cập nhật thư viện văn bản mẫu',
    noiDung: 'Đã bổ sung mẫu báo cáo thẩm tra theo năm nhóm tiêu chí chấm điểm.',
    ngayDang: '2026-04-05',
    mucDo: 'thuong',
  },
];

// --- ghi tệp ---------------------------------------------------------------
function ghi(duongDanTuongDoi, duLieu) {
  const duongDan = resolve(GOC, duongDanTuongDoi);
  mkdirSync(dirname(duongDan), { recursive: true });
  writeFileSync(duongDan, `${JSON.stringify(duLieu, null, 2)}\n`, 'utf8');
  console.log('đã ghi', duongDanTuongDoi);
}

ghi('data/mau/donvi.json', donVi);
ghi('data/mau/nghiquyet/2026.json', nghiQuyet);
ghi('data/mau/dotkiemtra/muc-luc.json', [KY]);
ghi(`data/mau/dotkiemtra/${KY}.json`, dotKiemTra);
ghi('data/mau/ketqua/2026.json', ketQua);
ghi('data/mau/kiennghi/2026.json', kienNghi);
ghi('data/mau/hoidap.json', hoiDap);
ghi('data/mau/vanbanmau.json', vanBanMau);
ghi('data/mau/bangtin.json', banTin);

console.log('\nĐợt', KY, 'seed', seed);
console.log('Ứng viên:', anhChupUngVien.length);
console.log('Trúng thăm:', danhSachTrung.join(', '));
console.log('Hạn giải trình:', HAN_GIAI_TRINH);
console.log(
  'Đơn vị chưa từng kiểm tra:',
  donVi.filter((d) => d.lanKiemTraGanNhat === null).length,
);
