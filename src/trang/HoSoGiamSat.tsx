import { useMemo, useState } from 'react';
import type {
  CapHanhChinh,
  ChuTheGiamSat,
  HoSoGiamSat as KieuHoSo,
  MaNhomGS,
  NhomNghiepVu,
  TrangThaiHoSo,
} from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { useGhi } from '../dulieu/useGhi';
import { usePhien } from '../dulieu/usePhien';
import { ghiJson, taiTepLen, type ThongTinKho } from '../dulieu/ghiGitHub';
import { duongDanTep } from '../dulieu/docJson';
import { hienThiNgay, kyThang } from '../nghiepvu/hanXuLy';
import { boDau } from '../nghiepvu/nhan';
import { thieuQuyen } from '../nghiepvu/phanQuyen';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan } from '../thanhphan/Nhan';

const NHAN_TRANG_THAI: Record<TrangThaiHoSo, string> = {
  du_thao: 'Dự thảo',
  dang_thuc_hien: 'Đang thực hiện',
  hoan_thanh: 'Hoàn thành',
};

const SAC_TRANG_THAI: Record<TrangThaiHoSo, 'trung_tinh' | 'dat' | 'luuy'> = {
  du_thao: 'trung_tinh',
  dang_thuc_hien: 'luuy',
  hoan_thanh: 'dat',
};

const NHOM_CO_MAN_HINH_RIENG: Record<string, { ten: string; den: string }> = {
  'GS-02': { ten: 'Danh mục rà soát', den: '/danh-muc-ra-soat' },
  'GS-11': { ten: 'Sau giám sát', den: '/theo-doi-sau-giam-sat' },
  'GS-12': { ten: 'Sau giám sát', den: '/theo-doi-sau-giam-sat' },
};

export default function HoSoGiamSat() {
  const du = useDuLieu();
  const { duocPhep, ghiDuoc, phien } = usePhien();
  const ghi = useGhi();
  const [maNhom, datMaNhom] = useState<MaNhomGS | ''>('');
  const [tuKhoa, datTuKhoa] = useState('');
  const [moBieuMau, datMoBieuMau] = useState(false);

  const nhomTheoMa = useMemo(
    () => new Map(du.khung.nhom.map((n) => [n.ma, n])),
    [du.khung.nhom],
  );

  const nhomMoDuoc = useMemo(
    () => du.khung.nhom.filter((n) => n.trienKhai !== 'khong_tren_kho_public'),
    [du.khung.nhom],
  );

  const nhomDangChon = maNhom === '' ? null : (nhomTheoMa.get(maNhom) ?? null);

  const danhSach = useMemo(() => {
    const tu = boDau(tuKhoa.trim());
    return du.hoSo
      .filter((h) => maNhom === '' || h.thuocTinh.nhomGS === maNhom)
      .filter((h) => {
        if (!tu) return true;
        const kho = `${h.tieuDe} ${h.nguoiLap} ${Object.values(h.dauMuc).join(' ')}`;
        return boDau(kho).includes(tu);
      })
      .sort((a, b) => (a.ngayLap < b.ngayLap ? 1 : -1));
  }, [du.hoSo, maNhom, tuKhoa]);

  const demTheoNhom = useMemo(() => {
    const dem = new Map<string, number>();
    for (const h of du.hoSo) {
      dem.set(h.thuocTinh.nhomGS, (dem.get(h.thuocTinh.nhomGS) ?? 0) + 1);
    }
    return dem;
  }, [du.hoSo]);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function luuHoSo(banGhi: KieuHoSo) {
    const con = du.hoSo.filter((h) => h.id !== banGhi.id);
    const moi = [...con, banGhi].sort((a, b) => (a.id < b.id ? -1 : 1));
    await ghi.chay(async () => {
      await ghiJson(
        kho,
        `data/hoso/${du.cauHinh.namLamViec}.json`,
        moi,
        `hoSo: ghi hồ sơ ${banGhi.thuocTinh.nhomGS} ${banGhi.id}`,
      );
      return `Đã lưu hồ sơ ${banGhi.id} thuộc nhóm ${banGhi.thuocTinh.nhomGS}.`;
    });
  }

  async function doiTrangThai(hoSo: KieuHoSo, trangThai: TrangThaiHoSo) {
    await luuHoSo({ ...hoSo, trangThai, ngayCapNhat: du.homNay });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl">Hồ sơ giám sát</h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            {du.hoSo.length} hồ sơ trên {nhomMoDuoc.length} nhóm nghiệp vụ
          </p>
        </div>
        {duocPhep('quanLyHoSo') && nhomDangChon && (
          <button
            type="button"
            className="nut-chinh"
            onClick={() => {
              datMoBieuMau((m) => !m);
              ghi.xoaThongBao();
            }}
          >
            {moBieuMau ? 'Đóng biểu mẫu' : `Lập hồ sơ ${nhomDangChon.ma}`}
          </button>
        )}
      </div>

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không lưu được hồ sơ">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã lưu">
          {ghi.thanhCong}
        </ThongBao>
      )}

      <div className="khung p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div>
            <label className="nhan-truong" htmlFor="hs-nhom">
              Nhóm nghiệp vụ
            </label>
            <select
              id="hs-nhom"
              className="o-nhap"
              value={maNhom}
              onChange={(e) => {
                datMaNhom(e.target.value as MaNhomGS | '');
                datMoBieuMau(false);
              }}
            >
              <option value="">Tất cả nhóm ({du.hoSo.length})</option>
              {nhomMoDuoc.map((n) => (
                <option key={n.ma} value={n.ma}>
                  {n.ma} — {n.ten} ({demTheoNhom.get(n.ma) ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="nhan-truong" htmlFor="hs-tu-khoa">
              Từ khóa
            </label>
            <input
              id="hs-tu-khoa"
              type="search"
              className="o-nhap"
              value={tuKhoa}
              onChange={(e) => datTuKhoa(e.target.value)}
              placeholder="Tiêu đề, người lập, nội dung đầu mục…"
            />
          </div>
        </div>
      </div>

      {nhomDangChon && (
        <div className="khung p-4">
          <h3 className="text-lg">
            <span className="so text-[#4A536B]">{nhomDangChon.ma}</span> {nhomDangChon.ten}
          </h3>
          <p className="mt-1 text-[0.9375rem] text-[#4A536B]">Căn cứ: {nhomDangChon.canCu}</p>
          {nhomDangChon.canhBaoDuLieu && (
            <div className="mt-3">
              <ThongBao loai="loi" tieuDe="Ràng buộc dữ liệu">
                {nhomDangChon.canhBaoDuLieu}
              </ThongBao>
            </div>
          )}
          {NHOM_CO_MAN_HINH_RIENG[nhomDangChon.ma] && (
            <p className="mt-3 text-[0.9375rem]">
              Nhóm này có màn hình nghiệp vụ riêng:{' '}
              <a href={`#${NHOM_CO_MAN_HINH_RIENG[nhomDangChon.ma]!.den}`} className="underline">
                {NHOM_CO_MAN_HINH_RIENG[nhomDangChon.ma]!.ten}
              </a>
              . Màn hình này chỉ dùng để lưu hồ sơ bổ sung.
            </p>
          )}
        </div>
      )}

      {moBieuMau && nhomDangChon && duocPhep('quanLyHoSo') && (
        <BieuMauHoSo
          nhom={nhomDangChon}
          namLamViec={du.cauHinh.namLamViec}
          homNay={du.homNay}
          nguoiLap={phien?.hoTen ?? ''}
          soHienCo={demTheoNhom.get(nhomDangChon.ma) ?? 0}
          dangGhi={ghi.dangGhi}
          ghiDuoc={ghiDuoc('quanLyHoSo')}
          kho={kho}
          onLuu={async (banGhi) => {
            await luuHoSo(banGhi);
            datMoBieuMau(false);
          }}
          onHuy={() => datMoBieuMau(false)}
        />
      )}

      {danhSach.length === 0 ? (
        <ManHinhTrong
          tieuDe={du.hoSo.length === 0 ? 'Chưa có hồ sơ giám sát nào' : 'Không có hồ sơ phù hợp'}
          moTa={
            du.hoSo.length === 0
              ? 'Chọn một nhóm nghiệp vụ rồi lập hồ sơ đầu tiên. Biểu mẫu sinh tự động theo bộ đầu mục khai trong data/khung-nghiep-vu.json.'
              : 'Thử nới bộ lọc hoặc bỏ bớt từ khóa.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {danhSach.map((h) => {
            const nhom = nhomTheoMa.get(h.thuocTinh.nhomGS);
            return (
              <li key={h.id} className="khung p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <div>
                    <h3 className="text-lg">{h.tieuDe}</h3>
                    <p className="mt-1 text-[0.9375rem] text-[#4A536B]">
                      <span className="so">{h.thuocTinh.nhomGS}</span>
                      {nhom ? ` · ${nhom.ten}` : ''} · kỳ <span className="so">{h.ky}</span> ·{' '}
                      {h.nguoiLap} · lập ngày{' '}
                      <span className="so">{hienThiNgay(h.ngayLap)}</span>
                    </p>
                  </div>
                  <Nhan sac={SAC_TRANG_THAI[h.trangThai]}>{NHAN_TRANG_THAI[h.trangThai]}</Nhan>
                </div>

                {nhom && nhom.dauMuc.length > 0 && (
                  <dl className="mt-3 grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
                    {nhom.dauMuc.map((dm) => (
                      <div key={dm.ma} className="flex gap-2">
                        <dt className="text-[#4A536B]">{dm.ten}:</dt>
                        <dd className={dm.kieu === 'ngay' || dm.kieu === 'so' ? 'so' : ''}>
                          {dm.kieu === 'ngay'
                            ? hienThiNgay(h.dauMuc[dm.ma] ?? null)
                            : (h.dauMuc[dm.ma] ?? '—')}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {h.tepDinhKem.length > 0 && (
                  <ul className="mt-2 text-[0.9375rem]">
                    {h.tepDinhKem.map((t) => (
                      <li key={t}>
                        <a className="underline" href={duongDanTep(t)} target="_blank" rel="noreferrer">
                          Xem tệp đính kèm
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {ghiDuoc('quanLyHoSo') && h.trangThai !== 'hoan_thanh' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {h.trangThai === 'du_thao' && (
                      <button
                        type="button"
                        className="nut-phu"
                        disabled={ghi.dangGhi}
                        onClick={() => doiTrangThai(h, 'dang_thuc_hien')}
                      >
                        Chuyển sang đang thực hiện
                      </button>
                    )}
                    <button
                      type="button"
                      className="nut-chinh"
                      disabled={ghi.dangGhi}
                      onClick={() => doiTrangThai(h, 'hoan_thanh')}
                    >
                      Đánh dấu hoàn thành
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!duocPhep('quanLyHoSo') && (
        <p className="text-[0.9375rem] text-[#4A536B]">{thieuQuyen('quanLyHoSo')}</p>
      )}
    </div>
  );
}

function BieuMauHoSo({
  nhom,
  namLamViec,
  homNay,
  nguoiLap,
  soHienCo,
  dangGhi,
  ghiDuoc,
  kho,
  onLuu,
  onHuy,
}: {
  nhom: NhomNghiepVu;
  namLamViec: number;
  homNay: string;
  nguoiLap: string;
  soHienCo: number;
  dangGhi: boolean;
  ghiDuoc: boolean;
  kho: ThongTinKho;
  onLuu: (banGhi: KieuHoSo) => Promise<void>;
  onHuy: () => void;
}) {
  const [tieuDe, datTieuDe] = useState('');
  const [chuThe, datChuThe] = useState<ChuTheGiamSat>(nhom.chuTheApDung[0] ?? 'thuong_truc');
  const [cap, datCap] = useState<CapHanhChinh>(nhom.capApDung[0] ?? 'tinh');
  const [ky, datKy] = useState(kyThang(homNay));
  const [dauMuc, datDauMuc] = useState<Record<string, string>>({});
  const [tep, datTep] = useState<File | null>(null);
  const [loiNhap, datLoiNhap] = useState<string[]>([]);

  const dat = (ma: string, giaTri: string) => datDauMuc((cu) => ({ ...cu, [ma]: giaTri }));

  async function gui(su: React.FormEvent) {
    su.preventDefault();
    const loi: string[] = [];
    if (!tieuDe.trim()) loi.push('Chưa nhập tiêu đề hồ sơ.');
    if (!/^\d{4}-\d{2}$/.test(ky)) loi.push('Kỳ phải theo dạng YYYY-MM.');
    for (const dm of nhom.dauMuc) {
      if (dm.batBuoc && dm.kieu !== 'tep' && !(dauMuc[dm.ma] ?? '').trim()) {
        loi.push(`Đầu mục bắt buộc "${dm.ten}" chưa có giá trị.`);
      }
    }
    datLoiNhap(loi);
    if (loi.length > 0) return;

    const id = `${nhom.ma}-${namLamViec}-${String(soHienCo + 1).padStart(3, '0')}`;
    const tepDinhKem: string[] = [];
    if (tep) {
      const duongDan = `data/files/${namLamViec}/${id}-${tep.name.replace(/[^\w.-]/g, '_')}`;
      await taiTepLen(kho, duongDan, tep, `hoSo: tải tệp đính kèm cho ${id}`);
      tepDinhKem.push(duongDan);
    }

    await onLuu({
      id,
      thuocTinh: { nhomGS: nhom.ma, chuThe, cap },
      tieuDe: tieuDe.trim(),
      ky,
      ngayLap: homNay,
      nguoiLap,
      trangThai: 'du_thao',
      dauMuc,
      tepDinhKem,
      ngayCapNhat: homNay,
    });
  }

  return (
    <form onSubmit={gui} className="khung space-y-4 p-4">
      <h3 className="text-lg">
        Lập hồ sơ <span className="so">{nhom.ma}</span> — {nhom.ten}
      </h3>

      {loiNhap.length > 0 && (
        <ThongBao loai="loi" tieuDe="Chưa lưu được, còn thiếu thông tin">
          <ul className="list-disc pl-5">
            {loiNhap.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </ThongBao>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="nhan-truong" htmlFor="hs-tieu-de">
            Tiêu đề hồ sơ
          </label>
          <input
            id="hs-tieu-de"
            className="o-nhap"
            value={tieuDe}
            onChange={(e) => datTieuDe(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="hs-chu-the">
            Chủ thể giám sát
          </label>
          <select
            id="hs-chu-the"
            className="o-nhap"
            value={chuThe}
            onChange={(e) => datChuThe(e.target.value as ChuTheGiamSat)}
          >
            {nhom.chuTheApDung.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="hs-cap">
            Cấp
          </label>
          <select
            id="hs-cap"
            className="o-nhap"
            value={cap}
            onChange={(e) => datCap(e.target.value as CapHanhChinh)}
          >
            {nhom.capApDung.map((c) => (
              <option key={c} value={c}>
                {c === 'tinh' ? 'Cấp tỉnh' : 'Cấp xã'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="hs-ky">
            Kỳ
          </label>
          <input
            id="hs-ky"
            className="o-nhap so"
            value={ky}
            onChange={(e) => datKy(e.target.value)}
            placeholder="2026-07"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {nhom.dauMuc.map((dm) =>
          dm.kieu === 'tep' ? (
            <div key={dm.ma}>
              <label className="nhan-truong" htmlFor={`hs-${dm.ma}`}>
                {dm.ten} {dm.batBuoc ? '' : '(không bắt buộc)'}
              </label>
              <input
                id={`hs-${dm.ma}`}
                type="file"
                className="o-nhap"
                onChange={(e) => datTep(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div key={dm.ma}>
              <label className="nhan-truong" htmlFor={`hs-${dm.ma}`}>
                {dm.ten} {dm.batBuoc ? '' : '(không bắt buộc)'}
              </label>
              {dm.kieu === 'danh_sach' ? (
                <textarea
                  id={`hs-${dm.ma}`}
                  className="o-nhap min-h-[5rem]"
                  value={dauMuc[dm.ma] ?? ''}
                  onChange={(e) => dat(dm.ma, e.target.value)}
                  placeholder="Mỗi mục một dòng"
                />
              ) : (
                <input
                  id={`hs-${dm.ma}`}
                  type={dm.kieu === 'ngay' ? 'date' : dm.kieu === 'so' ? 'number' : 'text'}
                  className={`o-nhap ${dm.kieu === 'ngay' || dm.kieu === 'so' ? 'so' : ''}`}
                  value={dauMuc[dm.ma] ?? ''}
                  onChange={(e) => dat(dm.ma, e.target.value)}
                />
              )}
            </div>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="nut-chinh" disabled={dangGhi || !ghiDuoc}>
          {dangGhi ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
        <button type="button" className="nut-phu" onClick={onHuy} disabled={dangGhi}>
          Hủy
        </button>
      </div>

      {!ghiDuoc && (
        <p className="text-[0.9375rem] text-[#4A536B]">
          Máy trạm này chưa cấu hình kết nối kho nên chưa ghi được. Liên hệ quản trị hệ thống.
        </p>
      )}
    </form>
  );
}
