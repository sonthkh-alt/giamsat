import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DiemNhom, KetQuaThamDinh } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { useGhi } from '../dulieu/useGhi';
import { usePhien } from '../dulieu/usePhien';
import { ghiJson, type ThongTinKho } from '../dulieu/ghiGitHub';
import {
  chamDiem,
  DIEM_NHOM_RONG,
  DIEM_TOI_DA,
  kiemTraDiem,
  MA_NHOM,
  TEN_NHOM,
} from '../nghiepvu/chamDiem';
import {
  congNgayLamViec,
  hienThiKyThang,
  hienThiNgay,
  kyThang,
  mucCanhBao,
  soNgayLamViecConLai,
  HAN_GIAI_TRINH,
  HAN_THAM_DINH,
} from '../nghiepvu/hanXuLy';
import { thieuQuyen } from '../nghiepvu/phanQuyen';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan, NhanHan, NhanXepLoai } from '../thanhphan/Nhan';

const CAC_BAN = [
  'Ban Pháp chế',
  'Ban Kinh tế - Ngân sách',
  'Ban Văn hóa - Xã hội',
  'Ban Dân tộc',
];

export default function ThamDinh() {
  const du = useDuLieu();
  const { ghiDuoc, duocPhep, phien } = usePhien();
  const chamDuoc = ghiDuoc('thamDinh');
  const chotDuoc = ghiDuoc('chotKetQua');
  const giaiTrinhDuoc = ghiDuoc('ghiGiaiTrinh');
  const xemNoiBo = duocPhep('thamDinh') || duocPhep('chotKetQua') || duocPhep('ghiGiaiTrinh');
  const ghi = useGhi();

  const kyHienTai = kyThang(du.homNay);
  const [kyDangXem, datKyDangXem] = useState(kyHienTai);
  const [dangCham, datDangCham] = useState<string | null>(null);

  const danhSachKy = useMemo(() => {
    const tap = new Set(du.dotRaSoat.map((d) => d.ky));
    tap.add(kyHienTai);
    return [...tap].sort().reverse();
  }, [du.dotRaSoat, kyHienTai]);

  const dot = du.dotRaSoat.find((d) => d.ky === kyDangXem) ?? null;
  const nghiQuyetTheoId = useMemo(
    () => new Map(du.nghiQuyet.map((nq) => [nq.id, nq])),
    [du.nghiQuyet],
  );
  const tenDonVi = useMemo(() => new Map(du.donVi.map((d) => [d.ma, d.ten])), [du.donVi]);
  const ketQuaTheoId = useMemo(
    () => new Map(du.ketQua.filter((k) => k.ky === kyDangXem).map((k) => [k.idNghiQuyet, k])),
    [du.ketQua, kyDangXem],
  );

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function luuKetQua(banGhi: KetQuaThamDinh, thongDiep: string, moTaThanhCong: string) {
    const con = du.ketQua.filter(
      (k) => !(k.ky === banGhi.ky && k.idNghiQuyet === banGhi.idNghiQuyet),
    );
    const danhSach = [...con, banGhi].sort((a, b) =>
      a.ky === b.ky ? (a.idNghiQuyet < b.idNghiQuyet ? -1 : 1) : a.ky < b.ky ? 1 : -1,
    );
    await ghi.chay(async () => {
      await ghiJson(kho, `data/ketqua/${du.cauHinh.namLamViec}.json`, danhSach, thongDiep);
      const phuThem = banGhi.trangThai === 'da_chot' ? await capNhatLanRaSoat(banGhi) : '';
      return moTaThanhCong + phuThem;
    });
  }

  async function capNhatLanRaSoat(banGhi: KetQuaThamDinh): Promise<string> {
    const nq = nghiQuyetTheoId.get(banGhi.idNghiQuyet);
    const dotCuaKy = du.dotRaSoat.find((d) => d.ky === banGhi.ky);
    if (!nq || !dotCuaKy) return '';
    const donViCanSua = du.donVi.find((d) => d.ma === nq.maDonVi);
    if (!donViCanSua) return '';
    if (
      donViCanSua.lanRaSoatGanNhat !== null &&
      donViCanSua.lanRaSoatGanNhat >= dotCuaKy.ngayMoDot
    ) {
      return '';
    }
    const danhSachDonVi = du.donVi.map((d) =>
      d.ma === nq.maDonVi ? { ...d, lanRaSoatGanNhat: dotCuaKy.ngayMoDot } : d,
    );
    await ghiJson(
      kho,
      'data/donvi.json',
      danhSachDonVi,
      `donVi: cập nhật lần rà soát gần nhất của ${nq.maDonVi}`,
    );
    return ` Lần rà soát gần nhất của ${donViCanSua.ten} đã cập nhật thành ${hienThiNgay(dotCuaKy.ngayMoDot)}.`;
  }

  if (!dot || dot.danhMucChinhThuc.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl">Thẩm định văn bản</h2>
        <ManHinhTrong
          tieuDe={
            dot
              ? `Kỳ ${hienThiKyThang(kyDangXem)} chưa có danh mục chính thức`
              : `Kỳ ${hienThiKyThang(kyDangXem)} chưa lập danh mục`
          }
          moTa="Phiếu thẩm định chỉ lập cho văn bản đã nằm trong danh mục chính thức do Thường trực quyết định. Sang trang Danh mục rà soát trước."
          hanhDong={
            <Link to="/danh-muc-ra-soat" className="nut-chinh">
              Sang trang Danh mục rà soát
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Thẩm định văn bản</h2>
          <p className="max-w-[85ch] text-[0.9375rem] text-[#4A536B]">
            Thang 100 điểm, năm nhóm tiêu chí. Hoàn thành thẩm định trong {HAN_THAM_DINH} ngày làm
            việc kể từ ngày mở đợt — hạn kỳ này là{' '}
            <span className="so">{hienThiNgay(dot.hanThamDinh)}</span>. Đơn vị có{' '}
            {HAN_GIAI_TRINH} ngày làm việc để giải trình.
          </p>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="chon-ky-td">
            Kỳ
          </label>
          <select
            id="chon-ky-td"
            className="o-nhap so"
            value={kyDangXem}
            onChange={(e) => {
              datKyDangXem(e.target.value);
              datDangCham(null);
              ghi.xoaThongBao();
            }}
          >
            {danhSachKy.map((ky) => (
              <option key={ky} value={ky}>
                {ky}
              </option>
            ))}
          </select>
        </div>
      </div>

      {du.homNay > dot.hanThamDinh && (
        <ThongBao loai="luu_y" tieuDe="Đã qua hạn hoàn thành thẩm định">
          Hạn thẩm định của kỳ này là {hienThiNgay(dot.hanThamDinh)}. Các phiếu chưa lập cần hoàn
          thành sớm để kịp công bố tại phiên họp tháng sau.
        </ThongBao>
      )}

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không lưu được kết quả">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã lưu">
          {ghi.thanhCong}
        </ThongBao>
      )}

      <ul className="space-y-4">
        {dot.danhMucChinhThuc.map((id) => {
          const nq = nghiQuyetTheoId.get(id);
          const ketQua = ketQuaTheoId.get(id) ?? null;
          const congKhai = ketQua?.trangThai === 'da_chot';
          const xemDuocChiTiet = congKhai || xemNoiBo;

          return (
            <li key={id} className="khung p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div>
                  <h3 className="text-lg">
                    {nq ? `${nq.so}/${nq.kyHieu}` : id}{' '}
                    <span className="font-normal text-[#4A536B]">
                      — {nq ? (tenDonVi.get(nq.maDonVi) ?? nq.maDonVi) : 'không tìm thấy văn bản'}
                    </span>
                  </h3>
                  {nq && <p className="trichdan mt-1 max-w-[80ch]">{nq.trichYeu}</p>}
                  {dot.phanCongBan[id] && (
                    <p className="mt-1 text-[0.9375rem] text-[#4A536B]">
                      Phân công: {dot.phanCongBan[id]}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!ketQua && <Nhan sac="luuy">Chưa chấm điểm</Nhan>}
                  {ketQua && ketQua.trangThai === 'chua_chot' && (
                    <>
                      <Nhan sac="luuy">Chờ chốt</Nhan>
                      <NhanHan
                        muc={mucCanhBao(ketQua.hanGiaiTrinh, du.homNay, du.ngayLe)}
                        soNgay={soNgayLamViecConLai(ketQua.hanGiaiTrinh, du.homNay, du.ngayLe)}
                      />
                    </>
                  )}
                  {ketQua && ketQua.trangThai === 'da_chot' && (
                    <>
                      <Nhan sac="dat">Đã chốt</Nhan>
                      <NhanXepLoai xepLoai={ketQua.xepLoai} />
                      <span className="so font-semibold">{ketQua.tongDiem}/100</span>
                    </>
                  )}
                </div>
              </div>

              {ketQua && ketQua.trangThai === 'chua_chot' && !xemDuocChiTiet && (
                <p className="mt-3 text-[0.9375rem] text-[#4A536B]">
                  Kết quả chấm điểm chỉ công bố sau khi hết thời hạn giải trình {HAN_GIAI_TRINH}{' '}
                  ngày làm việc và đã chốt. Hạn giải trình:{' '}
                  <span className="so">{hienThiNgay(ketQua.hanGiaiTrinh)}</span>.
                </p>
              )}

              {ketQua && xemDuocChiTiet && (
                <ChiTietKetQua
                  ketQua={ketQua}
                  chotDuoc={chotDuoc}
                  giaiTrinhDuoc={giaiTrinhDuoc}
                  dangGhi={ghi.dangGhi}
                  homNayISO={du.homNay}
                  onLuu={luuKetQua}
                />
              )}

              {!ketQua && chamDuoc && (
                <div className="mt-3">
                  {dangCham === id ? (
                    <PhieuChamDiem
                      idNghiQuyet={id}
                      ky={kyDangXem}
                      dangGhi={ghi.dangGhi}
                      banMacDinh={dot.phanCongBan[id] ?? CAC_BAN[0]!}
                      nguoiMacDinh={phien?.hoTen ?? ''}
                      hanGiaiTrinh={congNgayLamViec(du.homNay, HAN_GIAI_TRINH, du.ngayLe)}
                      onHuy={() => datDangCham(null)}
                      onLuu={async (banGhi) => {
                        await luuKetQua(
                          banGhi,
                          `thamDinh: chấm điểm ${banGhi.idNghiQuyet} kỳ ${banGhi.ky}`,
                          `Đã lưu phiếu thẩm định ${banGhi.idNghiQuyet}. Đơn vị có ${HAN_GIAI_TRINH} ngày làm việc để giải trình, hạn ${hienThiNgay(banGhi.hanGiaiTrinh)}.`,
                        );
                        datDangCham(null);
                      }}
                    />
                  ) : (
                    <button type="button" className="nut-chinh" onClick={() => datDangCham(id)}>
                      Lập phiếu thẩm định
                    </button>
                  )}
                </div>
              )}

              {!ketQua && !chamDuoc && (
                <p className="mt-3 text-[0.9375rem] text-[#4A536B]">
                  Chưa có phiếu thẩm định.{' '}
                  {duocPhep('thamDinh')
                    ? 'Máy trạm này chưa kết nối kho nên chưa chấm điểm được.'
                    : thieuQuyen('thamDinh')}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <details className="khung px-4 py-3">
        <summary className="cursor-pointer font-medium">Thang điểm và tiêu chí</summary>
        <table className="bang mt-3">
          <thead>
            <tr>
              <th scope="col">Nhóm tiêu chí</th>
              <th scope="col">Điểm tối đa</th>
            </tr>
          </thead>
          <tbody>
            {MA_NHOM.map((ma) => (
              <tr key={ma}>
                <td>{TEN_NHOM[ma]}</td>
                <td className="so">{DIEM_TOI_DA[ma]}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Tổng</td>
              <td className="so font-semibold">100</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[0.9375rem] text-[#4A536B]">
          Xếp loại: Tốt từ 90 điểm · Khá 75–89 · Đạt 60–74 · Chưa đạt dưới 60. Nếu văn bản có nội
          dung trái pháp luật thì xếp loại Chưa đạt, bất kể tổng điểm.
        </p>
        {du.tieuChi.length > 0 && (
          <ul className="mt-3 space-y-2">
            {du.tieuChi.map((nhom) => (
              <li key={nhom.ma}>
                <p className="font-medium">
                  {nhom.ten} <span className="so text-[#4A536B]">({nhom.diemToiDa} điểm)</span>
                </p>
                <ul className="list-disc pl-5 text-[0.9375rem] text-[#31394F]">
                  {nhom.tieuChi.map((tc) => (
                    <li key={tc.ma}>
                      {tc.noiDung} <span className="so text-[#4A536B]">({tc.diemToiDa})</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}

function PhieuChamDiem({
  idNghiQuyet,
  ky,
  hanGiaiTrinh,
  banMacDinh,
  nguoiMacDinh,
  dangGhi,
  onLuu,
  onHuy,
}: {
  idNghiQuyet: string;
  ky: string;
  hanGiaiTrinh: string;
  banMacDinh: string;
  nguoiMacDinh: string;
  dangGhi: boolean;
  onLuu: (banGhi: KetQuaThamDinh) => Promise<void>;
  onHuy: () => void;
}) {
  const [diemNhom, datDiemNhom] = useState<DiemNhom>({ ...DIEM_NHOM_RONG });
  const [traiPhapLuat, datTraiPhapLuat] = useState(false);
  const [nhanXet, datNhanXet] = useState('');
  const [nguoiThamDinh, datNguoiThamDinh] = useState(nguoiMacDinh);
  const [banThamDinh, datBanThamDinh] = useState(banMacDinh);
  const [loiNhap, datLoiNhap] = useState<string[]>([]);

  const { tongDiem, xepLoai } = chamDiem(diemNhom, traiPhapLuat);

  async function gui(su: React.FormEvent) {
    su.preventDefault();
    const loi = kiemTraDiem(diemNhom);
    if (!nguoiThamDinh.trim()) loi.push('Chưa ghi tên người thẩm định.');
    if (!nhanXet.trim()) loi.push('Chưa ghi nhận xét. Đơn vị cần biết căn cứ của điểm số.');
    datLoiNhap(loi);
    if (loi.length > 0) return;

    await onLuu({
      idNghiQuyet,
      ky,
      diemNhom,
      tongDiem,
      xepLoai,
      coNoiDungTraiPhapLuat: traiPhapLuat,
      nhanXet: nhanXet.trim(),
      nguoiThamDinh: nguoiThamDinh.trim(),
      banThamDinh,
      hanGiaiTrinh,
      giaiTrinh: null,
      trangThai: 'chua_chot',
    });
  }

  return (
    <form onSubmit={gui} className="mt-3 space-y-4 border-t border-vien pt-4">
      {loiNhap.length > 0 && (
        <ThongBao loai="loi" tieuDe="Chưa lưu được phiếu">
          <ul className="list-disc pl-5">
            {loiNhap.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </ThongBao>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MA_NHOM.map((ma) => (
          <div key={ma}>
            <label className="nhan-truong" htmlFor={`diem-${idNghiQuyet}-${ma}`}>
              {TEN_NHOM[ma]}{' '}
              <span className="so font-normal text-[#4A536B]">(0–{DIEM_TOI_DA[ma]})</span>
            </label>
            <input
              id={`diem-${idNghiQuyet}-${ma}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={DIEM_TOI_DA[ma]}
              step={1}
              className="o-nhap so"
              value={Number.isFinite(diemNhom[ma]) ? diemNhom[ma] : ''}
              onChange={(e) =>
                datDiemNhom((cu) => ({
                  ...cu,
                  [ma]: e.target.value === '' ? Number.NaN : Number(e.target.value),
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border border-vien bg-nen px-3 py-2">
        <p>
          Tổng điểm <span className="so text-xl font-semibold">{tongDiem}</span>/100
        </p>
        <NhanXepLoai xepLoai={xepLoai} />
      </div>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5"
          checked={traiPhapLuat}
          onChange={(e) => datTraiPhapLuat(e.target.checked)}
        />
        <span>
          Văn bản có nội dung trái pháp luật.
          <span className="block text-[0.9375rem] text-[#4A536B]">
            Đánh dấu ô này thì xếp loại là Chưa đạt, bất kể tổng điểm.
          </span>
        </span>
      </label>

      <div>
        <label className="nhan-truong" htmlFor={`nhan-xet-${idNghiQuyet}`}>
          Nhận xét
        </label>
        <textarea
          id={`nhan-xet-${idNghiQuyet}`}
          className="o-nhap min-h-[6rem]"
          value={nhanXet}
          onChange={(e) => datNhanXet(e.target.value)}
          placeholder="Nêu rõ điểm chưa đạt và căn cứ pháp lý…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="nhan-truong" htmlFor={`nguoi-${idNghiQuyet}`}>
            Người thẩm định
          </label>
          <input
            id={`nguoi-${idNghiQuyet}`}
            className="o-nhap"
            value={nguoiThamDinh}
            onChange={(e) => datNguoiThamDinh(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor={`ban-${idNghiQuyet}`}>
            Ban thẩm định
          </label>
          <select
            id={`ban-${idNghiQuyet}`}
            className="o-nhap"
            value={banThamDinh}
            onChange={(e) => datBanThamDinh(e.target.value)}
          >
            {CAC_BAN.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="nhan-truong">Hạn giải trình của đơn vị</p>
          <p className="so py-2">{hienThiNgay(hanGiaiTrinh)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="nut-chinh" disabled={dangGhi}>
          {dangGhi ? 'Đang lưu…' : 'Lưu phiếu thẩm định'}
        </button>
        <button type="button" className="nut-phu" onClick={onHuy} disabled={dangGhi}>
          Hủy
        </button>
      </div>
    </form>
  );
}

function ChiTietKetQua({
  ketQua,
  chotDuoc,
  giaiTrinhDuoc,
  dangGhi,
  homNayISO,
  onLuu,
}: {
  ketQua: KetQuaThamDinh;
  chotDuoc: boolean;
  giaiTrinhDuoc: boolean;
  dangGhi: boolean;
  homNayISO: string;
  onLuu: (banGhi: KetQuaThamDinh, thongDiep: string, moTa: string) => Promise<void>;
}) {
  const [giaiTrinh, datGiaiTrinh] = useState(ketQua.giaiTrinh ?? '');
  const daHetHanGiaiTrinh = homNayISO >= ketQua.hanGiaiTrinh;

  return (
    <div className="mt-3 space-y-3 border-t border-vien pt-3">
      <div className="overflow-x-auto">
        <table className="bang">
          <caption className="sr-only">Bảng điểm chi tiết</caption>
          <thead>
            <tr>
              <th scope="col">Nhóm tiêu chí</th>
              <th scope="col">Điểm</th>
              <th scope="col">Tối đa</th>
            </tr>
          </thead>
          <tbody>
            {MA_NHOM.map((ma) => (
              <tr key={ma}>
                <td>{TEN_NHOM[ma]}</td>
                <td className="so">{ketQua.diemNhom[ma]}</td>
                <td className="so text-[#4A536B]">{DIEM_TOI_DA[ma]}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Tổng</td>
              <td className="so font-semibold">{ketQua.tongDiem}</td>
              <td className="so text-[#4A536B]">100</td>
            </tr>
          </tbody>
        </table>
      </div>

      {ketQua.coNoiDungTraiPhapLuat && (
        <ThongBao loai="loi" tieuDe="Có nội dung trái pháp luật">
          Văn bản bị xếp loại Chưa đạt theo quy định, không phụ thuộc tổng điểm.
        </ThongBao>
      )}

      <div>
        <p className="nhan-truong">Nhận xét của người thẩm định</p>
        <p className="trichdan whitespace-pre-line">{ketQua.nhanXet}</p>
        <p className="mt-1 text-[0.9375rem] text-[#4A536B]">
          {ketQua.nguoiThamDinh}
          {ketQua.banThamDinh ? ` · ${ketQua.banThamDinh}` : ''} · hạn giải trình{' '}
          <span className="so">{hienThiNgay(ketQua.hanGiaiTrinh)}</span>
        </p>
      </div>

      {ketQua.giaiTrinh && (
        <div>
          <p className="nhan-truong">Giải trình của đơn vị</p>
          <p className="trichdan whitespace-pre-line">{ketQua.giaiTrinh}</p>
        </div>
      )}

      {(chotDuoc || giaiTrinhDuoc) && ketQua.trangThai === 'chua_chot' && (
        <div className="space-y-3 border-t border-vien pt-3">
          <div>
            <label className="nhan-truong" htmlFor={`giai-trinh-${ketQua.idNghiQuyet}`}>
              Ghi giải trình của đơn vị
            </label>
            <textarea
              id={`giai-trinh-${ketQua.idNghiQuyet}`}
              className="o-nhap min-h-[5rem]"
              value={giaiTrinh}
              onChange={(e) => datGiaiTrinh(e.target.value)}
              placeholder="Nội dung đơn vị giải trình…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="nut-phu"
              disabled={dangGhi || !giaiTrinhDuoc || giaiTrinh.trim() === (ketQua.giaiTrinh ?? '')}
              onClick={() =>
                onLuu(
                  { ...ketQua, giaiTrinh: giaiTrinh.trim() || null },
                  `thamDinh: ghi giải trình cho ${ketQua.idNghiQuyet}`,
                  'Đã lưu giải trình của đơn vị.',
                )
              }
            >
              Lưu giải trình
            </button>
            <button
              type="button"
              className="nut-chinh"
              disabled={dangGhi || !chotDuoc || !daHetHanGiaiTrinh}
              onClick={() =>
                onLuu(
                  { ...ketQua, giaiTrinh: giaiTrinh.trim() || null, trangThai: 'da_chot' },
                  `thamDinh: chốt kết quả ${ketQua.idNghiQuyet}`,
                  'Đã chốt kết quả. Từ giờ kết quả này hiển thị công khai.',
                )
              }
            >
              Chốt kết quả
            </button>
          </div>
          {!daHetHanGiaiTrinh && (
            <p className="text-[0.9375rem] text-[#4A536B]">
              Chưa chốt được: còn trong thời hạn giải trình, hết hạn ngày{' '}
              <span className="so">{hienThiNgay(ketQua.hanGiaiTrinh)}</span>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
