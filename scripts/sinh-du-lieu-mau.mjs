// Sinh bộ dữ liệu giả lập trong data/mau/.
//
//     node scripts/sinh-du-lieu-mau.mjs
//
// Chạy lại lệnh này luôn cho ra đúng bộ dữ liệu cũ: mọi chỗ ngẫu nhiên đều dùng
// bộ sinh số có seed cố định, không dùng Math.random().
//
// TÊN ĐƠN VỊ LÀ TÊN THẬT, lấy từ data/donvi_hanhchinh_thanhhoa_166.json.
// Mọi thứ còn lại — nghị quyết, điểm số, nhiệm vụ sau giám sát — đều là số liệu
// hư cấu, không phản ánh thực tế của bất kỳ đơn vị nào.
//
// Bộ quy tắc cảnh báo ở đây là bản sao rút gọn của src/nghiepvu/xepHangRuiRo.ts,
// chỉ đủ dùng để dựng dữ liệu mẫu. Kiểm thử src/nghiepvu/duLieuMau.test.ts chạy
// lại engine thật trên chính dữ liệu này và đối chiếu, nên sai lệch sẽ lộ ra.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const doc = (p) => JSON.parse(readFileSync(resolve(GOC, p), 'utf8'));

const cauHinh = doc('data/cauhinh.json');
const dauHieu = doc('data/dauhieu-canhbao.json');
const danhMucDvhc = doc('data/donvi_hanhchinh_thanhhoa_166.json').don_vi;
const NGAY_LE = doc('data/ngayle.json').map((n) => n.ngay);

const MA_MUOI = cauHinh.maMuoi;
const SO_MUC_TIEU = cauHinh.soVanBanRaSoatMoiThang;

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

// --- PRNG (chỉ dùng cho phần bổ sung ngẫu nhiên và cho dữ liệu giả lập) ------
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

// --- bản sao rút gọn của engine cảnh báo -----------------------------------
const boDau = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
const chua = (vanBan, cum) => boDau(vanBan).includes(boDau(cum));

function phatHienCanhBao(nq) {
  const ra = [];
  for (const canCu of nq.canCuPhapLy) {
    for (const m of dauHieu.canCuHetHieuLuc.danhMuc) {
      if (chua(canCu, m.mau)) ra.push({ diem: dauHieu.canCuHetHieuLuc.diem });
    }
  }
  const cho = [nq.trichYeu, ...nq.canCuPhapLy];
  for (const vb of cho) {
    for (const m of dauHieu.tenKhongConDung.danhMuc) {
      if (chua(vb, m.mau)) ra.push({ diem: dauHieu.tenKhongConDung.diem });
    }
  }
  for (const qt of dauHieu.thamQuyenTheoLinhVuc.quyTac) {
    if (qt.linhVuc === nq.linhVuc && qt.loai === nq.loai) {
      ra.push({ diem: dauHieu.thamQuyenTheoLinhVuc.diem });
    }
  }
  if (nq.loai === 'quy_pham') {
    const daCo = new Set(nq.hoSoTrinh);
    if (dauHieu.thanhPhanHoSo.batBuoc.some((tp) => !daCo.has(tp.ma))) {
      ra.push({ diem: dauHieu.thanhPhanHoSo.diem });
    }
    const nam = nq.ngayBanHanh.slice(0, 4);
    if (!nq.so.includes(`/${nam}`) && !nq.kyHieu.includes(nam)) {
      ra.push({ diem: dauHieu.theThuc.diem });
    }
  }
  return ra;
}
const diemRuiRo = (cb) => Math.min(cb.reduce((s, c) => s + c.diem, 0), 100);

// --- sinh đơn vị -----------------------------------------------------------
if (danhMucDvhc.length !== 166) {
  throw new Error(`Danh mục đơn vị phải có đúng 166 bản ghi, đang có ${danhMucDvhc.length}.`);
}
const rnd = mulberry32(bam32('du-lieu-gia-lap-166-don-vi'));
const donVi = danhMucDvhc.map((goc, i) => {
  const r = rnd();
  let lanRaSoat = null;
  if (r > 0.42) {
    lanRaSoat = themNgay('2025-08-01', Math.floor(rnd() * 320));
  }
  return {
    ma: `TH-${String(i + 1).padStart(3, '0')}`,
    maDvhc: goc.ma_dvhc,
    ten: goc.ten_day_du,
    loai: goc.loai === 'Phường' ? 'phuong' : 'xa',
    // Danh mục nguồn để trống cột vùng. Không tự gán vùng cho đơn vị có thật.
    vung: 'chua_phan_loai',
    lanRaSoatGanNhat: lanRaSoat,
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

const CAN_CU_CHUAN = [
  'Căn cứ Luật Tổ chức chính quyền địa phương;',
  'Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 64/2025/QH15;',
  'Căn cứ Luật Ngân sách nhà nước;',
];
// Căn cứ đã hết hiệu lực — cố tình gieo để hệ thống phát hiện được dấu hiệu.
const CAN_CU_CU = [
  'Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;',
  'Căn cứ Luật Tổ chức chính quyền địa phương số 77/2015/QH13;',
  'Căn cứ Nghị định số 34/2016/NĐ-CP của Chính phủ;',
];
const TRICH_YEU_TEN_CU = [
  'Về việc tiếp nhận bàn giao nhiệm vụ từ Ủy ban nhân dân huyện theo phân cấp',
  'Về việc kiện toàn tổ chức sau khi Phòng Tài chính - Kế hoạch chấm dứt hoạt động',
];
const THANH_PHAN = dauHieu.thanhPhanHoSo.batBuoc.map((t) => t.ma);

const rndNQ = mulberry32(bam32('du-lieu-gia-lap-nghi-quyet-2026-07'));
const nghiQuyet = [];
const demTheoDonVi = new Map();
for (let i = 0; i < 96; i += 1) {
  const dv = donVi[Math.floor(rndNQ() * donVi.length)];
  const so = (demTheoDonVi.get(dv.ma) ?? 0) + 1;
  demTheoDonVi.set(dv.ma, so);
  const ngayBanHanh = themNgay('2026-01-06', Math.floor(rndNQ() * 185));
  const r = rndNQ();
  const hieuLuc = r > 0.94 ? 'het_hieu_luc' : r > 0.9 ? 'da_thay_the' : 'con_hieu_luc';
  const linhVuc = LINH_VUC[Math.floor(rndNQ() * LINH_VUC.length)];
  const loai = rndNQ() > 0.35 ? 'quy_pham' : 'ca_biet';

  // Gieo dấu hiệu trên một phần văn bản để bộ phân tích có việc để phát hiện.
  const gieoCanCuCu = rndNQ() < 0.14;
  const gieoTenCu = rndNQ() < 0.08;
  const thieuHoSo = loai === 'quy_pham' && rndNQ() < 0.22;

  const canCuPhapLy = [...CAN_CU_CHUAN];
  if (gieoCanCuCu) canCuPhapLy.push(CAN_CU_CU[Math.floor(rndNQ() * CAN_CU_CU.length)]);

  const trichYeu = gieoTenCu
    ? TRICH_YEU_TEN_CU[Math.floor(rndNQ() * TRICH_YEU_TEN_CU.length)]
    : TRICH_YEU[Math.floor(rndNQ() * TRICH_YEU.length)];

  const hoSoTrinh =
    loai !== 'quy_pham' ? [] : thieuHoSo ? THANH_PHAN.slice(0, 2) : [...THANH_PHAN];

  const nam = ngayBanHanh.slice(0, 4);
  nghiQuyet.push({
    id: `${dv.ma}-${so}-2026`,
    maDonVi: dv.ma,
    // Văn bản quy phạm ghi số theo mẫu <số>/<năm>; một phần cố tình ghi thiếu năm.
    so: loai === 'quy_pham' && rndNQ() > 0.25 ? `${so}/${nam}` : String(so),
    kyHieu: 'NQ-HĐND',
    ngayBanHanh,
    kyHop: KY_HOP[Math.floor(rndNQ() * KY_HOP.length)],
    loai,
    linhVuc,
    trichYeu,
    hieuLuc,
    canCuPhapLy,
    hoSoTrinh,
    tepDinhKem: [],
    ngayCapNhat: themNgay(ngayBanHanh, 2),
  });
}
nghiQuyet.sort((a, b) => (a.ngayBanHanh < b.ngayBanHanh ? 1 : -1));

// --- lập danh mục đề xuất (bản sao rút gọn của lapDanhMuc.ts) ---------------
const NHAN_LINH_VUC = {
  ngan_sach: 'Ngân sách',
  dau_tu_cong: 'Đầu tư công',
  dat_dai: 'Đất đai',
  phi_le_phi: 'Phí, lệ phí',
  to_chuc_bo_may: 'Tổ chức bộ máy',
  che_do_chinh_sach: 'Chế độ, chính sách',
  khac: 'Lĩnh vực khác',
};
const TY_LE = { chuyen_de: 0.3, canh_bao: 0.3, de_nghi: 0.2, luan_phien: 0.2 };
const suat = (tyLe) => Math.max(1, Math.round(SO_MUC_TIEU * tyLe));

function lapDanhMuc(ky, linhVucTrongTam, deNghi, dotDaCo, ngayThamChieu) {
  const daRaSoat = new Set(dotDaCo.filter((d) => d.ky !== ky).flatMap((d) => d.danhMucChinhThuc));
  const ungVien = nghiQuyet
    .filter((nq) => nq.hieuLuc === 'con_hieu_luc' && !daRaSoat.has(nq.id))
    .map((nq) => {
      const cb = phatHienCanhBao(nq);
      return { nq, cb, diem: diemRuiRo(cb) };
    });
  const conLai = new Map(ungVien.map((u) => [u.nq.id, u]));
  const danhMuc = [];
  const donViTheoMa = new Map(donVi.map((d) => [d.ma, d]));
  const them = (u, cachThuc, lyDo) => {
    danhMuc.push({
      idNghiQuyet: u.nq.id,
      cachThuc,
      lyDo,
      diemRuiRo: u.diem,
      canhBao: [],
      nguoiDeXuat: 'Văn phòng Đoàn ĐBQH và HĐND tỉnh',
    });
    conLai.delete(u.nq.id);
  };
  const thieu = () => SO_MUC_TIEU - danhMuc.length;

  if (linhVucTrongTam) {
    const n = Math.min(suat(TY_LE.chuyen_de), thieu());
    for (const u of [...conLai.values()].filter((u) => u.nq.linhVuc === linhVucTrongTam).slice(0, n)) {
      them(
        u,
        'chuyen_de',
        `Thuộc lĩnh vực trọng tâm "${NHAN_LINH_VUC[linhVucTrongTam]}" Thường trực ấn định cho kỳ ${ky}.`,
      );
    }
  }
  {
    const n = Math.min(suat(TY_LE.canh_bao), thieu());
    const co = [...conLai.values()]
      .filter((u) => u.cb.length > 0)
      .sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.nq.id < b.nq.id ? -1 : 1))
      .slice(0, Math.max(0, n));
    for (const u of co) {
      them(u, 'canh_bao', `Điểm rủi ro ${u.diem}. Hệ thống phát hiện ${u.cb.length} dấu hiệu cần rà soát.`);
    }
  }
  {
    const n = Math.min(suat(TY_LE.de_nghi), thieu());
    let lay = 0;
    for (const dn of deNghi) {
      if (lay >= n) break;
      const u = conLai.get(dn.idNghiQuyet);
      if (!u) continue;
      them(u, 'de_nghi', `Theo đề nghị của ${dn.nguoiDeNghi}: ${dn.lyDo}`);
      lay += 1;
    }
  }
  {
    const n = Math.min(suat(TY_LE.luan_phien), thieu());
    const daChon = new Set(
      danhMuc.map((m) => nghiQuyet.find((nq) => nq.id === m.idNghiQuyet).maDonVi),
    );
    const theoLau = [...conLai.values()]
      .filter((u) => !daChon.has(u.nq.maDonVi))
      .map((u) => {
        const dv = donViTheoMa.get(u.nq.maDonVi);
        const cuoi = dv?.lanRaSoatGanNhat ?? null;
        return {
          u,
          ten: dv?.ten ?? u.nq.maDonVi,
          soNgay: cuoi === null ? Number.MAX_SAFE_INTEGER : soNgayDuongLich(cuoi, ngayThamChieu),
          cuoi,
        };
      })
      .sort((a, b) => (b.soNgay !== a.soNgay ? b.soNgay - a.soNgay : a.u.nq.id < b.u.nq.id ? -1 : 1))
      .slice(0, Math.max(0, n));
    for (const m of theoLau) {
      them(
        m.u,
        'luan_phien',
        m.cuoi === null
          ? `${m.ten} chưa từng được rà soát.`
          : `${m.ten} đã ${m.soNgay} ngày chưa được rà soát.`,
      );
    }
  }
  let seedNgauNhien = null;
  if (thieu() > 0 && conLai.size > 0) {
    seedNgauNhien = `${ky}-${MA_MUOI}`;
    const sinh = mulberry32(bam32(seedNgauNhien));
    const con = [...conLai.values()].sort((a, b) => (a.nq.id < b.nq.id ? -1 : 1));
    const canLay = Math.min(thieu(), con.length);
    for (let i = 0; i < canLay; i += 1) {
      const viTri = Math.min(Math.floor(sinh() * con.length), con.length - 1);
      const u = con.splice(viTri, 1)[0];
      them(
        u,
        'ngau_nhien',
        `Bổ sung ngẫu nhiên cho đủ ${SO_MUC_TIEU} văn bản của kỳ. Seed công khai "${seedNgauNhien}", tính lại được.`,
      );
    }
  }
  return { danhMuc, seedNgauNhien };
}

const BAN_THEO_LINH_VUC = {
  ngan_sach: 'Ban Kinh tế - Ngân sách',
  dau_tu_cong: 'Ban Kinh tế - Ngân sách',
  dat_dai: 'Ban Kinh tế - Ngân sách',
  phi_le_phi: 'Ban Kinh tế - Ngân sách',
  to_chuc_bo_may: 'Ban Pháp chế',
  che_do_chinh_sach: 'Ban Văn hóa - Xã hội',
  khac: 'Ban Pháp chế',
};
const nqTheoId = new Map(nghiQuyet.map((nq) => [nq.id, nq]));

function taoDot(ky, linhVucTrongTam, ngayMoDot, vanBanQuyetDinh, trangThai, deNghi, dotDaCo) {
  const { danhMuc, seedNgauNhien } = lapDanhMuc(ky, linhVucTrongTam, deNghi, dotDaCo, ngayMoDot);
  // Thường trực giữ phần lớn đề xuất, loại một văn bản kèm ghi chú.
  const boBot = danhMuc.length > 6 ? danhMuc[danhMuc.length - 1].idNghiQuyet : null;
  const chinhThuc = danhMuc
    .map((m) => m.idNghiQuyet)
    .filter((id) => id !== boBot)
    .sort();
  const phanCongBan = {};
  for (const id of chinhThuc) {
    phanCongBan[id] = BAN_THEO_LINH_VUC[nqTheoId.get(id).linhVuc];
  }
  const nhatKy = chinhThuc.map((id) => ({
    luc: themNgay(ngayMoDot, -1),
    nguoi: 'Nguyễn Văn A',
    hanhDong: 'them',
    idNghiQuyet: id,
    ghiChu: 'Thường trực đưa vào danh mục tại phiên họp',
  }));
  if (boBot) {
    nhatKy.push({
      luc: themNgay(ngayMoDot, -1),
      nguoi: 'Nguyễn Văn A',
      hanhDong: 'bo',
      idNghiQuyet: boBot,
      ghiChu: 'Đã rà soát trong đợt chuyên đề khác, không đưa vào kỳ này',
    });
  }
  return {
    ky,
    thuocTinh: { nhomGS: 'GS-02', chuThe: 'thuong_truc', cap: 'tinh' },
    linhVucTrongTam: linhVucTrongTam ? NHAN_LINH_VUC[linhVucTrongTam] : null,
    danhMucDeXuat: danhMuc,
    danhMucChinhThuc: chinhThuc,
    vanBanQuyetDinh,
    ngayMoDot,
    hanThamDinh: congNgayLamViec(ngayMoDot, 10),
    trangThai,
    seedNgauNhien,
    phanCongBan,
    nhatKyThayDoi: nhatKy,
  };
}

const DE_NGHI_06 = [];
const dot06 = taoDot(
  '2026-06',
  'ngan_sach',
  '2026-06-26',
  '184/TB-HĐND',
  'da_chot',
  DE_NGHI_06,
  [],
);
// Văn bản được đề nghị rà soát phải còn nằm ngoài các đợt trước, nếu không nó
// đã bị loại khỏi danh sách ứng viên và cách thức "de_nghi" sẽ không có tác dụng.
const daRaSoat06 = new Set(dot06.danhMucChinhThuc);
const nqDeNghi = nghiQuyet.filter(
  (nq) => nq.hieuLuc === 'con_hieu_luc' && nq.linhVuc === 'phi_le_phi' && !daRaSoat06.has(nq.id),
);
const DE_NGHI_07 = [
  {
    idNghiQuyet: nqDeNghi[0].id,
    nguoiDeNghi: 'Ban Thường trực Ủy ban Mặt trận Tổ quốc tỉnh',
    lyDo: 'Có phản ánh của cử tri về mức thu chưa phù hợp với điều kiện địa bàn',
  },
  {
    idNghiQuyet: nqDeNghi[1].id,
    nguoiDeNghi: 'Ban Kinh tế - Ngân sách Hội đồng nhân dân tỉnh',
    lyDo: 'Phát hiện dấu hiệu chưa thống nhất với nghị quyết của Hội đồng nhân dân tỉnh',
  },
];

const dot07 = taoDot('2026-07', 'dat_dai', '2026-07-27', '211/TB-HĐND', 'dang_tham_dinh', DE_NGHI_07, [
  dot06,
]);

// --- kết quả thẩm định -----------------------------------------------------
const BANG_DIEM = [
  {
    diemNhom: { thamQuyenHinhThuc: 20, trinhTuThuTuc: 18, noiDungHopPhap: 28, theThucTrinhBay: 9, khaThiThucTien: 18 },
    trai: false,
    nhanXet:
      'Hồ sơ đầy đủ, trình tự đúng quy định. Còn một số lỗi nhỏ về kỹ thuật trình bày ở phần căn cứ ban hành.',
  },
  {
    diemNhom: { thamQuyenHinhThuc: 18, trinhTuThuTuc: 14, noiDungHopPhap: 24, theThucTrinhBay: 8, khaThiThucTien: 15 },
    trai: false,
    nhanXet:
      'Thiếu bản tổng hợp, tiếp thu ý kiến đối tượng chịu tác động. Đề nghị bổ sung vào hồ sơ lưu và rút kinh nghiệm cho các văn bản sau.',
  },
  {
    diemNhom: { thamQuyenHinhThuc: 14, trinhTuThuTuc: 12, noiDungHopPhap: 18, theThucTrinhBay: 7, khaThiThucTien: 12 },
    trai: true,
    nhanXet:
      'Văn bản viện dẫn căn cứ đã hết hiệu lực và quy định mức thu vượt khung do cơ quan có thẩm quyền ấn định. Đề nghị đơn vị sửa đổi và báo cáo kết quả.',
  },
  {
    diemNhom: { thamQuyenHinhThuc: 19, trinhTuThuTuc: 17, noiDungHopPhap: 26, theThucTrinhBay: 9, khaThiThucTien: 16 },
    trai: false,
    nhanXet: 'Nội dung phù hợp thẩm quyền. Cần làm rõ nguồn kinh phí bảo đảm thực hiện trong năm ngân sách.',
  },
  {
    diemNhom: { thamQuyenHinhThuc: 20, trinhTuThuTuc: 19, noiDungHopPhap: 29, theThucTrinhBay: 10, khaThiThucTien: 19 },
    trai: false,
    nhanXet: 'Hồ sơ và nội dung đạt yêu cầu, không có kiến nghị sửa đổi.',
  },
  {
    diemNhom: { thamQuyenHinhThuc: 17, trinhTuThuTuc: 16, noiDungHopPhap: 25, theThucTrinhBay: 8, khaThiThucTien: 15 },
    trai: false,
    nhanXet: 'Sử dụng tên cơ quan không còn đúng sau sắp xếp đơn vị hành chính. Đề nghị đính chính.',
  },
];
const NGUOI = ['Lê Thị B', 'Trần Văn C', 'Phạm Thị D'];

function xepLoai(tong, trai) {
  if (trai) return 'chua_dat';
  if (tong >= 90) return 'tot';
  if (tong >= 75) return 'kha';
  if (tong >= 60) return 'dat';
  return 'chua_dat';
}

function taoKetQua(dot, ngayCham, soPhieu, trangThai) {
  return dot.danhMucChinhThuc.slice(0, soPhieu).map((id, i) => {
    const mau = BANG_DIEM[i % BANG_DIEM.length];
    const tong = Object.values(mau.diemNhom).reduce((a, b) => a + b, 0);
    return {
      idNghiQuyet: id,
      ky: dot.ky,
      diemNhom: mau.diemNhom,
      tongDiem: tong,
      xepLoai: xepLoai(tong, mau.trai),
      coNoiDungTraiPhapLuat: mau.trai,
      nhanXet: mau.nhanXet,
      nguoiThamDinh: NGUOI[i % NGUOI.length],
      banThamDinh: dot.phanCongBan[id],
      hanGiaiTrinh: congNgayLamViec(ngayCham, 5),
      giaiTrinh: i % 3 === 0 ? 'Đơn vị đã tiếp thu và có văn bản đính chính kèm theo.' : null,
      trangThai,
    };
  });
}

const ketQua = [
  ...taoKetQua(dot06, '2026-06-30', dot06.danhMucChinhThuc.length, 'da_chot'),
  ...taoKetQua(dot07, '2026-07-29', 3, 'chua_chot'),
];

// Đơn vị có kết quả ĐÃ CHỐT thì coi như vừa được rà soát trong đợt đó.
const donViTheoMa = new Map(donVi.map((d) => [d.ma, d]));
const dotTheoKy = new Map([dot06, dot07].map((d) => [d.ky, d]));
for (const kq of ketQua) {
  if (kq.trangThai !== 'da_chot') continue;
  const dv = donViTheoMa.get(nqTheoId.get(kq.idNghiQuyet).maDonVi);
  const ngay = dotTheoKy.get(kq.ky).ngayMoDot;
  if (dv && (dv.lanRaSoatGanNhat === null || dv.lanRaSoatGanNhat < ngay)) {
    dv.lanRaSoatGanNhat = ngay;
  }
}

// --- nhiệm vụ sau giám sát (GS-11, GS-12) ----------------------------------
const nhiemVu = [
  {
    id: 'NV-2026-001',
    thuocTinh: { nhomGS: 'GS-11', chuThe: 'thuong_truc', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '184/TB-HĐND', ngayBanHanh: '2026-06-26' },
    noiDungYeuCau:
      'Sửa đổi nghị quyết có nội dung trái pháp luật về mức thu phí, báo cáo kết quả về Thường trực Hội đồng nhân dân tỉnh.',
    coQuanChuTri: `Ủy ban nhân dân ${donVi[41].ten}`,
    coQuanPhoiHop: ['Sở Tài chính'],
    nguoiChiuTrachNhiem: 'Chủ tịch Ủy ban nhân dân xã',
    sanPhamPhaiHoanThanh: 'Nghị quyết sửa đổi và báo cáo kết quả thực hiện',
    hanHoanThanh: '2026-07-24',
    trangThai: 'qua_han',
    minhChung: [],
    buocXuLy: [
      { ma: 'don_doc_1', ngay: '2026-07-27', soVanBan: '245/HĐND-VP', ghiChu: 'Đôn đốc bằng văn bản' },
    ],
    hanGiaiTrinhDieu40: '2026-08-14',
    ngayXacNhanHoanThanh: null,
  },
  {
    id: 'NV-2026-002',
    thuocTinh: { nhomGS: 'GS-11', chuThe: 'ban', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '184/TB-HĐND', ngayBanHanh: '2026-06-26' },
    noiDungYeuCau:
      'Bổ sung bản tổng hợp, tiếp thu ý kiến đối tượng chịu tác động vào hồ sơ lưu của các nghị quyết đã ban hành trong năm 2026.',
    coQuanChuTri: `Ủy ban nhân dân ${donVi[87].ten}`,
    coQuanPhoiHop: [],
    nguoiChiuTrachNhiem: 'Công chức Tư pháp - Hộ tịch',
    sanPhamPhaiHoanThanh: 'Hồ sơ lưu đã bổ sung đầy đủ, có biên bản kiểm tra',
    hanHoanThanh: '2026-08-14',
    trangThai: 'chua_hoan_thanh',
    minhChung: [],
    buocXuLy: [],
    hanGiaiTrinhDieu40: null,
    ngayXacNhanHoanThanh: null,
  },
  {
    id: 'NV-2026-003',
    thuocTinh: { nhomGS: 'GS-11', chuThe: 'thuong_truc', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '152/TB-HĐND', ngayBanHanh: '2026-05-28' },
    noiDungYeuCau:
      'Đính chính tên cơ quan không còn đúng sau sắp xếp đơn vị hành chính trong các văn bản đã ban hành.',
    coQuanChuTri: `Ủy ban nhân dân ${donVi[123].ten}`,
    coQuanPhoiHop: [],
    nguoiChiuTrachNhiem: 'Chánh Văn phòng Ủy ban nhân dân xã',
    sanPhamPhaiHoanThanh: 'Văn bản đính chính',
    hanHoanThanh: '2026-06-30',
    trangThai: 'hoan_thanh',
    minhChung: [],
    buocXuLy: [
      { ma: 'don_doc_1', ngay: '2026-06-15', soVanBan: '198/HĐND-VP', ghiChu: 'Đôn đốc lần 1' },
    ],
    hanGiaiTrinhDieu40: null,
    ngayXacNhanHoanThanh: '2026-06-25',
  },
  {
    id: 'NV-2026-004',
    thuocTinh: { nhomGS: 'GS-12', chuThe: 'thuong_truc', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '120/TB-HĐND', ngayBanHanh: '2026-04-24' },
    noiDungYeuCau:
      'Bãi bỏ nội dung vượt thẩm quyền trong nghị quyết về quản lý đất công ích và báo cáo Hội đồng nhân dân tỉnh.',
    coQuanChuTri: `Ủy ban nhân dân ${donVi[9].ten}`,
    coQuanPhoiHop: ['Sở Nông nghiệp và Môi trường'],
    nguoiChiuTrachNhiem: 'Chủ tịch Ủy ban nhân dân phường',
    sanPhamPhaiHoanThanh: 'Nghị quyết bãi bỏ và báo cáo giải trình',
    hanHoanThanh: '2026-06-12',
    trangThai: 'chua_dap_ung_yeu_cau',
    minhChung: [],
    buocXuLy: [
      { ma: 'don_doc_1', ngay: '2026-06-16', soVanBan: '201/HĐND-VP', ghiChu: 'Đôn đốc lần 1' },
      { ma: 'don_doc_tiep', ngay: '2026-07-01', soVanBan: '219/HĐND-VP', ghiChu: 'Đôn đốc lần 2' },
      {
        ma: 'kien_nghi_xu_ly',
        ngay: '2026-07-15',
        soVanBan: '233/HĐND-VP',
        ghiChu: 'Kiến nghị Ủy ban nhân dân tỉnh xem xét trách nhiệm',
      },
    ],
    hanGiaiTrinhDieu40: '2026-07-27',
    ngayXacNhanHoanThanh: null,
  },
  {
    id: 'NV-2026-005',
    thuocTinh: { nhomGS: 'GS-11', chuThe: 'ban', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '184/TB-HĐND', ngayBanHanh: '2026-06-26' },
    noiDungYeuCau:
      'Rà soát toàn bộ văn bản còn viện dẫn Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13, lập danh sách cần thay thế.',
    coQuanChuTri: `Ủy ban nhân dân ${donVi[150].ten}`,
    coQuanPhoiHop: [],
    nguoiChiuTrachNhiem: 'Công chức Tư pháp - Hộ tịch',
    sanPhamPhaiHoanThanh: 'Danh sách văn bản cần thay thế kèm lộ trình',
    hanHoanThanh: '2026-08-31',
    trangThai: 'hoan_thanh_mot_phan',
    minhChung: [],
    buocXuLy: [],
    hanGiaiTrinhDieu40: null,
    ngayXacNhanHoanThanh: null,
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
    canCuPhapLy: ['Luật Ban hành văn bản quy phạm pháp luật số 64/2025/QH15'],
    ngayCapNhat: '2026-03-10',
  },
  {
    id: 'HD-002',
    cauHoi: 'Hồ sơ trình nghị quyết quy phạm pháp luật gồm những gì?',
    traLoi:
      'Tối thiểu gồm: tờ trình, dự thảo nghị quyết, bản tổng hợp và tiếp thu ý kiến của đối tượng chịu tác động, báo cáo thẩm tra của Ban của Hội đồng nhân dân. Thiếu bản tổng hợp ý kiến là dấu hiệu bị hệ thống cảnh báo và bị trừ điểm nhiều nhất ở nhóm trình tự, thủ tục.',
    chuDe: 'Trình tự, thủ tục',
    canCuPhapLy: ['Luật Ban hành văn bản quy phạm pháp luật số 64/2025/QH15'],
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
    cauHoi: 'Danh mục văn bản rà soát hằng tháng do ai quyết định?',
    traLoi:
      'Thường trực Hội đồng nhân dân tỉnh quyết định, tại phiên họp và ghi vào thông báo kết luận. Phần mềm chỉ tập hợp, phân tích, xếp hạng và trình danh mục đề xuất kèm lý do từng văn bản. Thường trực có quyền thêm hoặc bỏ bất kỳ văn bản nào; mọi thay đổi đều được ghi lại ai sửa và sửa lúc nào. Không có bốc thăm tự động quyết định thay con người.',
    chuDe: 'Danh mục rà soát',
    canCuPhapLy: ['Quy chế rà soát văn bản quy phạm pháp luật của Hội đồng nhân dân cấp xã'],
    ngayCapNhat: '2026-06-01',
  },
  {
    id: 'HD-005',
    cauHoi: 'Đơn vị không đồng ý với kết quả chấm điểm thì làm thế nào?',
    traLoi:
      'Đơn vị có 5 ngày làm việc kể từ ngày nhận kết quả để gửi giải trình. Giải trình được ghi vào phiếu thẩm định và xem xét trước khi chốt kết quả. Sau khi chốt, kết quả mới được công bố công khai và báo cáo tại phiên họp tháng sau.',
    chuDe: 'Thẩm định và giải trình',
    canCuPhapLy: ['Quy chế rà soát văn bản quy phạm pháp luật của Hội đồng nhân dân cấp xã'],
    ngayCapNhat: '2026-05-18',
  },
  {
    id: 'HD-006',
    cauHoi: 'Kiến nghị sau giám sát quá hạn thì xử lý thế nào?',
    traLoi:
      'Hệ thống chuyển cảnh báo đỏ và khởi tạo quy trình yêu cầu giải trình theo Điều 40 Luật Hoạt động giám sát số 121/2025/QH15: thời hạn 15 ngày, trường hợp phức tạp không quá 30 ngày. Lưu ý đây là ngày dương lịch chứ không phải ngày làm việc. Sau đó áp dụng lần lượt bảy bước xử lý, từ đôn đốc đến báo cáo Hội đồng nhân dân xem xét trách nhiệm.',
    chuDe: 'Theo dõi sau giám sát',
    canCuPhapLy: ['Điều 40 Luật Hoạt động giám sát của Quốc hội và Hội đồng nhân dân số 121/2025/QH15'],
    ngayCapNhat: '2026-06-20',
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
    tieuDe: `Danh mục rà soát tháng 7/2026 đã được quyết định`,
    noiDung: `Thường trực Hội đồng nhân dân tỉnh đã quyết định danh mục ${dot07.danhMucChinhThuc.length} văn bản tại Thông báo ${dot07.vanBanQuyetDinh}. Lĩnh vực trọng tâm tháng này là đất đai. Hạn hoàn thành thẩm định ${dot07.hanThamDinh.split('-').reverse().join('/')}.`,
    ngayDang: '2026-07-27',
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
    tieuDe: 'Hệ thống bổ sung cảnh báo căn cứ pháp lý hết hiệu lực',
    noiDung:
      'Từ kỳ tháng 6/2026, hệ thống tự đối chiếu căn cứ viện dẫn với danh mục văn bản đã hết hiệu lực và tên cơ quan không còn đúng sau sắp xếp 01/7/2025. Mỗi cảnh báo đều nêu rõ lý do và trích dẫn vị trí trong văn bản.',
    ngayDang: '2026-06-05',
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
ghi('data/mau/dotrasoat/muc-luc.json', ['2026-07', '2026-06']);
ghi('data/mau/dotrasoat/2026-06.json', dot06);
ghi('data/mau/dotrasoat/2026-07.json', dot07);
ghi('data/mau/ketqua/2026.json', ketQua);
ghi('data/mau/nhiemvu/2026.json', nhiemVu);
ghi('data/mau/hoidap.json', hoiDap);
ghi('data/mau/vanbanmau.json', vanBanMau);
ghi('data/mau/bangtin.json', banTin);

console.log('');
for (const dot of [dot06, dot07]) {
  const dem = {};
  for (const m of dot.danhMucDeXuat) dem[m.cachThuc] = (dem[m.cachThuc] ?? 0) + 1;
  console.log(
    `Kỳ ${dot.ky}: đề xuất ${dot.danhMucDeXuat.length}, chính thức ${dot.danhMucChinhThuc.length}`,
    JSON.stringify(dem),
    '| seed ngẫu nhiên:',
    dot.seedNgauNhien ?? 'không dùng',
  );
}
console.log('Đơn vị chưa từng rà soát:', donVi.filter((d) => d.lanRaSoatGanNhat === null).length);
