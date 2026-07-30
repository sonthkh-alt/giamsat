import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DotKiemTra } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { useGhi } from '../dulieu/useGhi';
import { usePhien } from '../dulieu/usePhien';
import { ghiJson, type ThongTinKho } from '../dulieu/ghiGitHub';
import { hienThiNgay } from '../nghiepvu/hanXuLy';
import { NHAN_LINH_VUC } from '../nghiepvu/nhan';
import {
  kiemChungRutTham,
  kyRutTham,
  rutTham,
  taoSeed,
  THAM_SO_TRONG_SO_MAC_DINH,
  type KetQuaRutTham,
} from '../nghiepvu/rutTham';
import { lapDanhSachUngVien } from '../nghiepvu/ungVienRutTham';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan } from '../thanhphan/Nhan';

type KetQuaKiemChung = {
  khop: boolean;
  sanhSai: string[];
  dungAnhChup: boolean;
  khopDuLieuHienTai: boolean;
} | null;

export default function RutTham() {
  const du = useDuLieu();
  const { coQuyenGhi } = usePhien();
  const ghi = useGhi();

  const kyHienTai = kyRutTham(du.homNay);
  const [kyDangXem, datKyDangXem] = useState(kyHienTai);
  const [xemTruoc, datXemTruoc] = useState<KetQuaRutTham | null>(null);
  const [kiemChung, datKiemChung] = useState<KetQuaKiemChung>(null);

  const danhSachKy = useMemo(() => {
    const tap = new Set(du.dotKiemTra.map((d) => d.ky));
    tap.add(kyHienTai);
    return [...tap].sort().reverse();
  }, [du.dotKiemTra, kyHienTai]);

  const dot = du.dotKiemTra.find((d) => d.ky === kyDangXem) ?? null;

  const ungVien = useMemo(
    () =>
      lapDanhSachUngVien({
        nghiQuyet: du.nghiQuyet,
        donVi: du.donVi,
        ketQua: du.ketQua,
        dotKiemTra: du.dotKiemTra,
        ky: kyDangXem,
      }),
    [du, kyDangXem],
  );

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

  function moTaNghiQuyet(id: string): string {
    const nq = nghiQuyetTheoId.get(id);
    if (!nq) return id;
    return `${nq.so}/${nq.kyHieu} — ${tenDonVi.get(nq.maDonVi) ?? nq.maDonVi}`;
  }

  function chayThu() {
    datKiemChung(null);
    datXemTruoc(
      rutTham({
        ungVien,
        soLuongCanRut: du.cauHinh.soNghiQuyetRutMoiTuan,
        ngayRutTham: du.homNay,
        maMuoi: du.cauHinh.maMuoi,
        ky: kyDangXem,
      }),
    );
  }

  function chayKiemChung() {
    if (!dot) return;
    // Căn cứ chính là ảnh chụp dữ liệu đầu vào đã lưu cùng đợt: nó nằm cố định
    // trong lịch sử kho nên không bị dữ liệu về sau làm sai lệch.
    const anhChup = dot.anhChupUngVien ?? null;
    const theoAnhChup = kiemChungRutTham(dot, anhChup ?? ungVien, du.cauHinh.maMuoi);
    const theoHienTai = kiemChungRutTham(dot, ungVien, du.cauHinh.maMuoi);
    datKiemChung({
      khop: theoAnhChup.khop,
      sanhSai: theoAnhChup.sanhSai,
      dungAnhChup: anhChup !== null,
      khopDuLieuHienTai: theoHienTai.khop,
    });
  }

  async function chotDot() {
    if (!xemTruoc) return;
    await ghi.chay(async () => {
      const banGhi: DotKiemTra = {
        ky: xemTruoc.ky,
        ngayRutTham: xemTruoc.ngayRutTham,
        seed: xemTruoc.seed,
        thamSoTrongSo: xemTruoc.thamSoTrongSo,
        danhSachTrung: xemTruoc.danhSachTrung,
        nguoiPhanCong: {},
        ungVien: xemTruoc.ungVien,
        anhChupUngVien: [...ungVien].sort((a, b) => (a.id < b.id ? -1 : 1)),
        soLuongCanRut: du.cauHinh.soNghiQuyetRutMoiTuan,
      };
      await ghiJson(
        kho,
        `data/dotkiemtra/${banGhi.ky}.json`,
        banGhi,
        `rutTham: ghi đợt kiểm tra ${banGhi.ky}`,
      );
      const mucLuc = [...new Set([...du.dotKiemTra.map((d) => d.ky), banGhi.ky])].sort().reverse();
      await ghiJson(
        kho,
        'data/dotkiemtra/muc-luc.json',
        mucLuc,
        `rutTham: cập nhật mục lục đợt kiểm tra`,
      );
      return `Đã ghi đợt ${banGhi.ky} với ${banGhi.danhSachTrung.length} nghị quyết. Seed công khai: ${banGhi.seed}`;
    });
    datXemTruoc(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Rút thăm kiểm tra ngẫu nhiên</h2>
        <p className="max-w-[80ch] text-[0.9375rem] text-[#4A536B]">
          Kết quả rút thăm được sinh bằng bộ số giả ngẫu nhiên có seed cố định, không dùng số ngẫu
          nhiên của trình duyệt. Cùng seed và cùng danh sách ứng viên thì luôn ra cùng kết quả, nên
          bất kỳ ai cũng tính lại và đối chiếu được.
        </p>
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
              datKiemChung(null);
              ghi.xoaThongBao();
            }}
          >
            {danhSachKy.map((ky) => (
              <option key={ky} value={ky}>
                {ky}
                {ky === kyHienTai ? ' (tuần này)' : ''}
              </option>
            ))}
          </select>
        </div>
        <dl className="grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Mã muối công bố trước:</dt>
            <dd className="so">{du.cauHinh.maMuoi}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Seed của kỳ:</dt>
            <dd className="so">{taoSeed(kyDangXem, du.cauHinh.maMuoi)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Số nghị quyết rút mỗi tuần:</dt>
            <dd className="so">{du.cauHinh.soNghiQuyetRutMoiTuan}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[#4A536B]">Ứng viên đủ điều kiện:</dt>
            <dd className="so">{ungVien.length}</dd>
          </div>
        </dl>
      </div>

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không ghi được đợt kiểm tra">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã ghi đợt kiểm tra">
          {ghi.thanhCong}
        </ThongBao>
      )}

      {dot ? (
        <section aria-labelledby="tieu-de-ket-qua" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 id="tieu-de-ket-qua" className="text-lg">
              Kết quả đã ghi cho kỳ <span className="so">{dot.ky}</span>
            </h3>
            <button type="button" className="nut-chinh" onClick={chayKiemChung}>
              Chạy lại để kiểm chứng
            </button>
          </div>

          {kiemChung && (
            <ThongBao
              loai={kiemChung.khop ? 'thanh_cong' : 'loi'}
              tieuDe={
                kiemChung.khop
                  ? 'Tính lại cho đúng kết quả đã lưu'
                  : 'Tính lại KHÔNG khớp với kết quả đã lưu'
              }
            >
              {kiemChung.khop ? (
                <>
                  <p>
                    Chạy lại thuật toán với seed <span className="so">{dot.seed}</span> và{' '}
                    {kiemChung.dungAnhChup
                      ? `${dot.anhChupUngVien?.length ?? 0} ứng viên trong ảnh chụp đã lưu cùng đợt`
                      : `${ungVien.length} ứng viên tính từ dữ liệu hiện tại`}{' '}
                    cho ra đúng danh sách bên dưới.
                  </p>
                  {kiemChung.dungAnhChup && !kiemChung.khopDuLieuHienTai && (
                    <p className="mt-1">
                      Lưu ý: tính lại từ dữ liệu <em>hiện tại</em> thì ra danh sách khác, vì cơ sở
                      dữ liệu nghị quyết và ngày kiểm tra của các đơn vị đã thay đổi kể từ ngày rút
                      thăm. Điều này bình thường và không ảnh hưởng tính hợp lệ của đợt.
                    </p>
                  )}
                </>
              ) : (
                <ul className="list-disc pl-5">
                  {kiemChung.sanhSai.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                  <li>
                    {kiemChung.dungAnhChup
                      ? 'Đợt này có ảnh chụp dữ liệu đầu vào mà tính lại vẫn không khớp — nghĩa là danh sách trúng đã bị sửa tay. Đối chiếu lịch sử commit của tệp.'
                      : 'Đợt này không lưu ảnh chụp dữ liệu đầu vào nên phải tính lại từ dữ liệu hiện tại; danh sách nghị quyết có thể đã thay đổi sau ngày rút thăm.'}{' '}
                    Tệp cần xem: <span className="so">data/dotkiemtra/{dot.ky}.json</span>.
                  </li>
                </ul>
              )}
            </ThongBao>
          )}

          <dl className="khung grid gap-x-8 gap-y-1 p-4 text-[0.9375rem] sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-[#4A536B]">Ngày rút thăm:</dt>
              <dd className="so">{hienThiNgay(dot.ngayRutTham)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[#4A536B]">Seed đã dùng:</dt>
              <dd className="so break-all">{dot.seed}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[#4A536B]">Trọng số:</dt>
              <dd className="so">
                {Object.entries(dot.thamSoTrongSo)
                  .map(([ten, giaTri]) => `${ten}=${giaTri}`)
                  .join(', ')}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[#4A536B]">Số ứng viên lúc rút:</dt>
              <dd className="so">{dot.ungVien?.length ?? 'không ghi lại'}</dd>
            </div>
          </dl>

          <ol className="space-y-2">
            {dot.danhSachTrung.map((id, i) => (
              <li key={id} className="khung flex flex-wrap items-baseline gap-x-3 px-4 py-3">
                <span className="so text-[#4A536B]">{i + 1}.</span>
                <strong>{moTaNghiQuyet(id)}</strong>
                <span className="so text-[0.875rem] text-[#4A536B]">{id}</span>
                {nghiQuyetTheoId.get(id) && (
                  <Nhan>{NHAN_LINH_VUC[nghiQuyetTheoId.get(id)!.linhVuc]}</Nhan>
                )}
                {dot.nguoiPhanCong[id] && <Nhan sac="dat">Giao: {dot.nguoiPhanCong[id]}</Nhan>}
              </li>
            ))}
          </ol>

          <p className="text-[0.9375rem] text-[#4A536B]">
            Sang trang{' '}
            <Link to="/tham-dinh" className="underline">
              Thẩm định
            </Link>{' '}
            để chấm điểm các nghị quyết trúng thăm.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {ungVien.length === 0 ? (
            <ManHinhTrong
              tieuDe={`Kỳ ${kyDangXem} chưa rút thăm được`}
              moTa="Chưa có nghị quyết nào còn hiệu lực và chưa từng được kiểm tra. Nhập nghị quyết vào cơ sở dữ liệu trước."
              hanhDong={
                <Link to="/nghi-quyet" className="nut-chinh">
                  Sang trang Nghị quyết
                </Link>
              }
            />
          ) : (
            <>
              <ThongBao loai="luu_y" tieuDe={`Kỳ ${kyDangXem} chưa có đợt kiểm tra`}>
                Theo Quy chế, việc rút thăm thực hiện vào 8h00 sáng thứ Hai hằng tuần. Kết quả chỉ
                phụ thuộc seed nên chạy lúc nào trong tuần cũng ra cùng danh sách.
              </ThongBao>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="nut-phu" onClick={chayThu}>
                  Xem trước kết quả rút thăm
                </button>
                {xemTruoc && coQuyenGhi && (
                  <button
                    type="button"
                    className="nut-chinh"
                    onClick={chotDot}
                    disabled={ghi.dangGhi}
                  >
                    {ghi.dangGhi ? 'Đang ghi lên kho…' : 'Ghi đợt kiểm tra lên kho'}
                  </button>
                )}
              </div>

              {xemTruoc && !coQuyenGhi && (
                <p className="text-[0.9375rem] text-[#4A536B]">
                  Đây mới là bản xem trước. Muốn ghi chính thức, dán mã truy cập ở trang{' '}
                  <Link to="/quan-tri" className="underline">
                    Quản trị
                  </Link>
                  .
                </p>
              )}

              {xemTruoc && (
                <div className="space-y-3">
                  <h3 className="text-lg">
                    Xem trước — {xemTruoc.danhSachTrung.length} nghị quyết trúng thăm
                  </h3>
                  <ol className="space-y-2">
                    {xemTruoc.danhSachTrung.map((id, i) => (
                      <li
                        key={id}
                        className="khung flex flex-wrap items-baseline gap-x-3 px-4 py-3"
                      >
                        <span className="so text-[#4A536B]">{i + 1}.</span>
                        <strong>{moTaNghiQuyet(id)}</strong>
                        <span className="so text-[0.875rem] text-[#4A536B]">{id}</span>
                      </li>
                    ))}
                  </ol>

                  <details className="khung px-4 py-3">
                    <summary className="cursor-pointer font-medium">
                      Nhật ký từng lượt rút ({xemTruoc.nhatKy.length} lượt)
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <table className="bang">
                        <thead>
                          <tr>
                            <th scope="col">Lượt</th>
                            <th scope="col">Tổng trọng số</th>
                            <th scope="col">Số ngẫu nhiên</th>
                            <th scope="col">Mốc</th>
                            <th scope="col">Nghị quyết trúng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {xemTruoc.nhatKy.map((buoc) => (
                            <tr key={buoc.luot}>
                              <td className="so">{buoc.luot}</td>
                              <td className="so">{buoc.tongTrongSo}</td>
                              <td className="so">{buoc.soNgauNhien.toFixed(9)}</td>
                              <td className="so">{buoc.moc.toFixed(4)}</td>
                              <td className="so">{buoc.idTrung}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <details className="khung px-4 py-3">
        <summary className="cursor-pointer font-medium">
          Bảng trọng số của {ungVien.length} ứng viên
        </summary>
        <p className="mt-2 text-[0.9375rem] text-[#4A536B]">
          Hệ số áp dụng: đơn vị chưa kiểm tra trong 6 tháng ×
          {THAM_SO_TRONG_SO_MAC_DINH.chuaKiemTraSauThang}, lĩnh vực ưu tiên ×
          {THAM_SO_TRONG_SO_MAC_DINH.linhVucUuTien}, đơn vị kỳ trước chưa đạt ×
          {THAM_SO_TRONG_SO_MAC_DINH.kyTruocChuaDat}. Các hệ số nhân dồn với nhau.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="bang">
            <thead>
              <tr>
                <th scope="col">Nghị quyết</th>
                <th scope="col">Đơn vị</th>
                <th scope="col">Trọng số</th>
                <th scope="col">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {rutTham({
                ungVien,
                soLuongCanRut: 0,
                ngayRutTham: du.homNay,
                maMuoi: du.cauHinh.maMuoi,
                ky: kyDangXem,
              })
                .trongSo.slice()
                .sort((a, b) => b.trongSo - a.trongSo)
                .map((t) => (
                  <tr key={t.id}>
                    <td className="so">{t.id}</td>
                    <td>
                      {tenDonVi.get(nghiQuyetTheoId.get(t.id)?.maDonVi ?? '') ?? '—'}
                    </td>
                    <td className="so">{t.trongSo}</td>
                    <td>{t.lyDo.length === 0 ? 'Không có hệ số ưu tiên' : t.lyDo.join('; ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
