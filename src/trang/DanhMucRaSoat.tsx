import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CanhBao, DotRaSoat, LinhVuc, MucDeXuat } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { useGhi } from '../dulieu/useGhi';
import { usePhien } from '../dulieu/usePhien';
import { ghiJson, type ThongTinKho } from '../dulieu/ghiGitHub';
import { hienThiKyThang, hienThiNgay, kyThang } from '../nghiepvu/hanXuLy';
import {
  lapDanhMucDeXuat,
  mocChuKy,
  suaDanhMucChinhThuc,
  tinhHanThamDinh,
  NHAN_CACH_THUC,
  NHAN_TRANG_THAI_DOT,
} from '../nghiepvu/lapDanhMuc';
import { NHAN_LINH_VUC } from '../nghiepvu/nhan';
import { thieuQuyen } from '../nghiepvu/phanQuyen';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan } from '../thanhphan/Nhan';

const SAC_CACH_THUC: Record<string, 'trung_tinh' | 'dat' | 'luuy' | 'canhbao'> = {
  chuyen_de: 'dat',
  canh_bao: 'canhbao',
  de_nghi: 'luuy',
  luan_phien: 'trung_tinh',
  ngau_nhien: 'trung_tinh',
};

function DanhSachCanhBao({ canhBao }: { canhBao: readonly CanhBao[] }) {
  if (canhBao.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 border-l-2 border-vien pl-3 text-[0.9375rem]">
      {canhBao.map((cb, i) => (
        <li key={`${cb.dauHieu}-${i}`}>
          <span className={cb.mucDo === 'cao' ? 'font-medium text-canhbao' : 'font-medium'}>
            {cb.lyDo}
          </span>
          <span className="block text-[#4A536B]">
            {cb.viTri.truong}: <span className="trichdan">“{cb.viTri.trichDan}”</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function DanhMucRaSoat() {
  const du = useDuLieu();
  const { ghiDuoc, duocPhep, phien } = usePhien();
  const lapDuoc = ghiDuoc('lapDanhMuc');
  const quyetDinhDuoc = ghiDuoc('quyetDinhDanhMuc');
  const ghi = useGhi();

  const kyHienTai = kyThang(du.homNay);
  const [kyDangXem, datKyDangXem] = useState(kyHienTai);
  const [linhVucTrongTam, datLinhVucTrongTam] = useState<LinhVuc | ''>('');
  const [xemTruoc, datXemTruoc] = useState<MucDeXuat[] | null>(null);
  const [seedXemTruoc, datSeedXemTruoc] = useState<string | null>(null);

  const danhSachKy = useMemo(() => {
    const tap = new Set(du.dotRaSoat.map((d) => d.ky));
    tap.add(kyHienTai);
    return [...tap].sort().reverse();
  }, [du.dotRaSoat, kyHienTai]);

  const dot = du.dotRaSoat.find((d) => d.ky === kyDangXem) ?? null;
  const moc = mocChuKy(kyDangXem, du.cauHinh);
  const nghiQuyetTheoId = useMemo(
    () => new Map(du.nghiQuyet.map((nq) => [nq.id, nq])),
    [du.nghiQuyet],
  );
  const tenDonVi = useMemo(() => new Map(du.donVi.map((d) => [d.ma, d.ten])), [du.donVi]);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  function moTa(id: string): string {
    const nq = nghiQuyetTheoId.get(id);
    if (!nq) return id;
    return `${nq.so}/${nq.kyHieu} — ${tenDonVi.get(nq.maDonVi) ?? nq.maDonVi}`;
  }

  function chayPhanTich() {
    const kq = lapDanhMucDeXuat({
      ky: kyDangXem,
      nghiQuyet: du.nghiQuyet,
      donVi: du.donVi,
      dotDaCo: du.dotRaSoat,
      cauHinhDauHieu: du.cauHinhDauHieu,
      linhVucTrongTam: linhVucTrongTam === '' ? null : linhVucTrongTam,
      deNghi: [],
      soLuongMucTieu: du.cauHinh.soVanBanRaSoatMoiThang,
      maMuoi: du.cauHinh.maMuoi,
      nguoiDeXuat: phien?.hoTen ?? 'Văn phòng',
      ngayThamChieu: du.homNay,
    });
    datXemTruoc(kq.danhMucDeXuat);
    datSeedXemTruoc(kq.seedNgauNhien);
  }

  async function luuDot(banGhi: DotRaSoat, thongDiep: string, moTaXong: string) {
    await ghi.chay(async () => {
      await ghiJson(kho, `data/dotrasoat/${banGhi.ky}.json`, banGhi, thongDiep);
      const mucLuc = [...new Set([...du.dotRaSoat.map((d) => d.ky), banGhi.ky])].sort().reverse();
      await ghiJson(
        kho,
        'data/dotrasoat/muc-luc.json',
        mucLuc,
        'danhMuc: cập nhật mục lục đợt rà soát',
      );
      return moTaXong;
    });
  }

  async function trinhDanhMuc() {
    if (!xemTruoc) return;
    const banGhi: DotRaSoat = {
      ky: kyDangXem,
      thuocTinh: { nhomGS: 'GS-02', chuThe: 'thuong_truc', cap: 'tinh' },
      linhVucTrongTam: linhVucTrongTam === '' ? null : NHAN_LINH_VUC[linhVucTrongTam],
      danhMucDeXuat: xemTruoc,
      danhMucChinhThuc: [],
      vanBanQuyetDinh: '',
      ngayMoDot: du.homNay,
      hanThamDinh: tinhHanThamDinh(du.homNay, du.ngayLe),
      trangThai: 'de_xuat',
      seedNgauNhien: seedXemTruoc,
      phanCongBan: {},
      nhatKyThayDoi: [],
    };
    await luuDot(
      banGhi,
      `danhMuc: trình danh mục đề xuất kỳ ${kyDangXem}`,
      `Đã trình danh mục đề xuất kỳ ${kyDangXem} với ${xemTruoc.length} văn bản. Thường trực quyết định danh mục chính thức ở bước sau.`,
    );
    datXemTruoc(null);
  }

  async function chuyen(idNghiQuyet: string, hanhDong: 'them' | 'bo') {
    if (!dot) return;
    const nguoi = phien?.hoTen ?? '';
    if (!nguoi.trim()) {
      ghi.chay(async () => {
        throw new Error('Phiên đăng nhập không có họ tên. Đăng xuất rồi đăng nhập lại.');
      });
      return;
    }
    const banGhi = suaDanhMucChinhThuc(dot, {
      hanhDong,
      idNghiQuyet,
      nguoi,
      ghiChu: hanhDong === 'them' ? 'Thường trực đưa vào danh mục' : 'Thường trực loại khỏi danh mục',
      luc: du.homNay,
    });
    await luuDot(
      banGhi,
      `danhMuc: ${hanhDong === 'them' ? 'đưa' : 'loại'} ${idNghiQuyet} ${hanhDong === 'them' ? 'vào' : 'khỏi'} danh mục kỳ ${dot.ky}`,
      `Đã ${hanhDong === 'them' ? 'đưa vào' : 'loại khỏi'} danh mục chính thức: ${moTa(idNghiQuyet)}.`,
    );
  }

  async function doiTrangThai(trangThai: DotRaSoat['trangThai'], vanBanQuyetDinh?: string) {
    if (!dot) return;
    const banGhi: DotRaSoat = {
      ...dot,
      trangThai,
      vanBanQuyetDinh: vanBanQuyetDinh ?? dot.vanBanQuyetDinh,
    };
    await luuDot(
      banGhi,
      `danhMuc: chuyển đợt ${dot.ky} sang trạng thái ${trangThai}`,
      `Đợt ${dot.ky} chuyển sang "${NHAN_TRANG_THAI_DOT[trangThai]}".`,
    );
  }

  const daChon = new Set(dot?.danhMucChinhThuc ?? []);
  const deXuat = dot?.danhMucDeXuat ?? [];
  const conLai = deXuat.filter((m) => !daChon.has(m.idNghiQuyet));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Danh mục rà soát văn bản quy phạm pháp luật</h2>
      </div>

      <div className="khung flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="nhan-truong" htmlFor="chon-ky">
            Kỳ
          </label>
          <select
            id="chon-ky"
            className="o-nhap so"
            value={kyDangXem}
            onChange={(e) => {
              datKyDangXem(e.target.value);
              datXemTruoc(null);
              ghi.xoaThongBao();
            }}
          >
            {danhSachKy.map((ky) => (
              <option key={ky} value={ky}>
                {ky}
                {ky === kyHienTai ? ' (tháng này)' : ''}
              </option>
            ))}
          </select>
        </div>
        <dl className="grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Ngày tổng hợp, chạy phân tích:</dt>
            <dd className="so">{hienThiNgay(moc.ngayTongHop)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Ngày trình danh mục:</dt>
            <dd className="so">{hienThiNgay(moc.ngayTrinhDanhMuc)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Số văn bản mục tiêu:</dt>
            <dd className="so">{du.cauHinh.soVanBanRaSoatMoiThang}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Trạng thái:</dt>
            <dd>{dot ? NHAN_TRANG_THAI_DOT[dot.trangThai] : 'Chưa lập danh mục'}</dd>
          </div>
        </dl>
      </div>

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không thực hiện được">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã ghi lên kho">
          {ghi.thanhCong}
        </ThongBao>
      )}

      {!dot ? (
        <section className="space-y-4">
          <div className="khung flex flex-wrap items-end gap-4 p-4">
            <div>
              <label className="nhan-truong" htmlFor="linh-vuc-trong-tam">
                Lĩnh vực trọng tâm tháng này
              </label>
              <select
                id="linh-vuc-trong-tam"
                className="o-nhap"
                value={linhVucTrongTam}
                onChange={(e) => datLinhVucTrongTam(e.target.value as LinhVuc | '')}
              >
                <option value="">Không ấn định lĩnh vực trọng tâm</option>
                {Object.entries(NHAN_LINH_VUC).map(([ma, nhan]) => (
                  <option key={ma} value={ma}>
                    {nhan}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="nut-phu" onClick={chayPhanTich}>
              Chạy phân tích, lập danh mục đề xuất
            </button>
            {xemTruoc && lapDuoc && (
              <button
                type="button"
                className="nut-chinh"
                onClick={trinhDanhMuc}
                disabled={ghi.dangGhi}
              >
                {ghi.dangGhi ? 'Đang ghi…' : 'Trình danh mục đề xuất'}
              </button>
            )}
          </div>

          {xemTruoc && xemTruoc.length === 0 && (
            <ManHinhTrong
              tieuDe="Chưa lập được danh mục"
              moTa="Không có nghị quyết nào còn hiệu lực và chưa rà soát. Nhập nghị quyết vào cơ sở dữ liệu trước."
              hanhDong={
                <Link to="/nghi-quyet" className="nut-chinh">
                  Sang trang Nghị quyết
                </Link>
              }
            />
          )}

          {xemTruoc && xemTruoc.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg">Danh mục đề xuất — {xemTruoc.length} văn bản</h3>
              <ul className="space-y-2">
                {xemTruoc.map((muc) => (
                  <li key={muc.idNghiQuyet} className="khung p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <strong>{moTa(muc.idNghiQuyet)}</strong>
                      <div className="flex items-center gap-2">
                        <Nhan sac={SAC_CACH_THUC[muc.cachThuc]}>
                          {NHAN_CACH_THUC[muc.cachThuc]}
                        </Nhan>
                        <span className="so text-[0.875rem] text-[#4A536B]">
                          Điểm rủi ro {muc.diemRuiRo}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-[0.9375rem]">{muc.lyDo}</p>
                    <DanhSachCanhBao canhBao={muc.canhBao} />
                  </li>
                ))}
              </ul>
              {!lapDuoc && (
                <p className="text-[0.9375rem] text-[#4A536B]">
                  Đây là bản xem trước.{' '}
                  {duocPhep('lapDanhMuc')
                    ? 'Máy trạm này chưa kết nối kho nên chưa trình chính thức được.'
                    : thieuQuyen('lapDanhMuc')}
                </p>
              )}
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="ban-lam-viec" className="space-y-4">
          <h3 id="ban-lam-viec" className="text-lg">
            Bàn quyết định danh mục {hienThiKyThang(dot.ky)}
          </h3>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h4 className="font-semibold">Đề xuất chờ quyết định</h4>
                <span className="so text-[0.875rem] text-[#4A536B]">{conLai.length} văn bản</span>
              </div>
              {conLai.length === 0 ? (
                <p className="khung px-4 py-3 text-[#4A536B]">
                  Đã xử lý hết đề xuất. Mọi văn bản đều đã được đưa vào hoặc loại khỏi danh mục.
                </p>
              ) : (
                <ul className="space-y-2">
                  {conLai.map((muc) => (
                    <li key={muc.idNghiQuyet} className="khung p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <strong className="text-[0.9375rem]">{moTa(muc.idNghiQuyet)}</strong>
                        <Nhan sac={SAC_CACH_THUC[muc.cachThuc]}>
                          {NHAN_CACH_THUC[muc.cachThuc]}
                        </Nhan>
                      </div>
                      <p className="mt-1 text-[0.9375rem] text-[#31394F]">{muc.lyDo}</p>
                      <DanhSachCanhBao canhBao={muc.canhBao} />
                      {quyetDinhDuoc && dot.trangThai !== 'da_chot' && (
                        <button
                          type="button"
                          className="nut-chinh mt-2"
                          disabled={ghi.dangGhi}
                          onClick={() => chuyen(muc.idNghiQuyet, 'them')}
                        >
                          Đưa vào danh mục chính thức
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h4 className="font-semibold">Danh mục chính thức</h4>
                <span className="so text-[0.875rem] text-[#4A536B]">
                  {dot.danhMucChinhThuc.length} văn bản
                </span>
              </div>
              {dot.danhMucChinhThuc.length === 0 ? (
                <p className="khung px-4 py-3 text-[#4A536B]">
                  Chưa có văn bản nào trong danh mục chính thức. Thường trực đưa từng văn bản từ
                  cột trái sang, hoặc loại ra kèm ghi chú.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dot.danhMucChinhThuc.map((id) => {
                    const muc = deXuat.find((m) => m.idNghiQuyet === id);
                    return (
                      <li key={id} className="khung border-l-4 border-l-muc p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <strong className="text-[0.9375rem]">{moTa(id)}</strong>
                          {muc && (
                            <Nhan sac={SAC_CACH_THUC[muc.cachThuc]}>
                              {NHAN_CACH_THUC[muc.cachThuc]}
                            </Nhan>
                          )}
                        </div>
                        {!muc && (
                          <p className="mt-1 text-[0.9375rem] text-[#4A536B]">
                            Thường trực bổ sung ngoài danh mục đề xuất.
                          </p>
                        )}
                        {quyetDinhDuoc && dot.trangThai !== 'da_chot' && (
                          <button
                            type="button"
                            className="nut-phu mt-2"
                            disabled={ghi.dangGhi}
                            onClick={() => chuyen(id, 'bo')}
                          >
                            Loại khỏi danh mục
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {quyetDinhDuoc && dot.trangThai === 'de_xuat' && dot.danhMucChinhThuc.length > 0 && (
            <BieuMauQuyetDinh dangGhi={ghi.dangGhi} onXacNhan={(so) => doiTrangThai('da_quyet_dinh', so)} />
          )}

          {quyetDinhDuoc && dot.trangThai === 'da_quyet_dinh' && (
            <div className="khung p-4">
              <p className="mb-2">
                Danh mục đã được quyết định tại văn bản{' '}
                <span className="so">{dot.vanBanQuyetDinh || '—'}</span>. Mở đợt để phân công các
                Ban thẩm định; hạn hoàn thành thẩm định là{' '}
                <span className="so">{hienThiNgay(dot.hanThamDinh)}</span>.
              </p>
              <button
                type="button"
                className="nut-chinh"
                disabled={ghi.dangGhi}
                onClick={() => doiTrangThai('dang_tham_dinh')}
              >
                Mở đợt thẩm định
              </button>
            </div>
          )}

          {dot.trangThai === 'dang_tham_dinh' && (
            <p className="text-[0.9375rem] text-[#4A536B]">
              Đợt đang thẩm định. Sang trang{' '}
              <Link to="/tham-dinh" className="underline">
                Thẩm định
              </Link>{' '}
              để chấm điểm. Hạn hoàn thành{' '}
              <span className="so">{hienThiNgay(dot.hanThamDinh)}</span>.
            </p>
          )}

          {dot.nhatKyThayDoi.length > 0 && (
            <details className="khung px-4 py-3">
              <summary className="cursor-pointer font-medium">
                Nhật ký sửa danh mục ({dot.nhatKyThayDoi.length} thay đổi)
              </summary>
              <table className="bang mt-3">
                <thead>
                  <tr>
                    <th scope="col">Lúc</th>
                    <th scope="col">Người sửa</th>
                    <th scope="col">Hành động</th>
                    <th scope="col">Văn bản</th>
                    <th scope="col">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {dot.nhatKyThayDoi.map((td, i) => (
                    <tr key={`${td.idNghiQuyet}-${i}`}>
                      <td className="so">{hienThiNgay(td.luc)}</td>
                      <td>{td.nguoi}</td>
                      <td>{td.hanhDong === 'them' ? 'Đưa vào' : 'Loại khỏi'}</td>
                      <td className="so">{td.idNghiQuyet}</td>
                      <td>{td.ghiChu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function BieuMauQuyetDinh({
  dangGhi,
  onXacNhan,
}: {
  dangGhi: boolean;
  onXacNhan: (soVanBan: string) => void;
}) {
  const [so, datSo] = useState('');
  return (
    <form
      className="khung space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (so.trim()) onXacNhan(so.trim());
      }}
    >
      <h4 className="font-semibold">Ghi nhận quyết định của Thường trực</h4>
      <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
        <div>
          <label className="nhan-truong" htmlFor="so-thong-bao">
            Số thông báo kết luận phiên họp
          </label>
          <input
            id="so-thong-bao"
            className="o-nhap so"
            value={so}
            onChange={(e) => datSo(e.target.value)}
            placeholder="123/TB-HĐND"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="nut-chinh" disabled={dangGhi || !so.trim()}>
            Quyết định danh mục
          </button>
        </div>
      </div>
    </form>
  );
}
