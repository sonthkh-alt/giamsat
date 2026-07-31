import { useMemo, useState } from 'react';
import type { HieuLuc, LinhVuc, LoaiNghiQuyet, NghiQuyet as KieuNghiQuyet } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { usePhien } from '../dulieu/usePhien';
import { useGhi } from '../dulieu/useGhi';
import { duongDanTep } from '../dulieu/docJson';
import { ghiJson, taiTepLen, type ThongTinKho } from '../dulieu/ghiGitHub';
import { hienThiNgay, homNay as tinhHomNay } from '../nghiepvu/hanXuLy';
import {
  boDau,
  NHAN_HIEU_LUC,
  NHAN_LINH_VUC,
  NHAN_LOAI_NGHI_QUYET,
} from '../nghiepvu/nhan';
import { phatHienCanhBao, tinhDiemRuiRo } from '../nghiepvu/xepHangRuiRo';
import { thieuQuyen } from '../nghiepvu/phanQuyen';
import { Nhan } from '../thanhphan/Nhan';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';

const MOI = 'moi';

type BoLoc = {
  tuKhoa: string;
  maDonVi: string;
  linhVuc: string;
  loai: string;
  hieuLuc: string;
};

const BO_LOC_RONG: BoLoc = {
  tuKhoa: '',
  maDonVi: MOI,
  linhVuc: MOI,
  loai: MOI,
  hieuLuc: MOI,
};

export default function NghiQuyet() {
  const du = useDuLieu();
  const { ghiDuoc, duocPhep } = usePhien();
  const nhapDuoc = ghiDuoc('nhapNghiQuyet');
  const ghi = useGhi();
  const [boLoc, datBoLoc] = useState<BoLoc>(BO_LOC_RONG);
  const [moBieuMau, datMoBieuMau] = useState(false);

  const tenDonVi = useMemo(
    () => new Map(du.donVi.map((d) => [d.ma, d.ten])),
    [du.donVi],
  );

  const canhBaoTheoId = useMemo(() => {
    const bang = new Map<string, ReturnType<typeof phatHienCanhBao>>();
    for (const nq of du.nghiQuyet) bang.set(nq.id, phatHienCanhBao(nq, du.cauHinhDauHieu));
    return bang;
  }, [du.nghiQuyet, du.cauHinhDauHieu]);

  const ketQua = useMemo(() => {
    const tuKhoa = boDau(boLoc.tuKhoa.trim());
    return du.nghiQuyet
      .filter((nq) => {
        if (boLoc.maDonVi !== MOI && nq.maDonVi !== boLoc.maDonVi) return false;
        if (boLoc.linhVuc !== MOI && nq.linhVuc !== boLoc.linhVuc) return false;
        if (boLoc.loai !== MOI && nq.loai !== boLoc.loai) return false;
        if (boLoc.hieuLuc !== MOI && nq.hieuLuc !== boLoc.hieuLuc) return false;
        if (!tuKhoa) return true;
        const kho = boDau(
          `${nq.so} ${nq.kyHieu} ${nq.trichYeu} ${nq.kyHop} ${tenDonVi.get(nq.maDonVi) ?? ''} ${nq.maDonVi}`,
        );
        return kho.includes(tuKhoa);
      })
      .sort((a, b) => (a.ngayBanHanh < b.ngayBanHanh ? 1 : -1));
  }, [du.nghiQuyet, boLoc, tenDonVi]);

  const dat = (phan: Partial<BoLoc>) => datBoLoc((cu) => ({ ...cu, ...phan }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl">Cơ sở dữ liệu nghị quyết cấp xã</h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            Năm {du.cauHinh.namLamViec} — {du.nghiQuyet.length} nghị quyết đã nhập, đang hiển thị{' '}
            {ketQua.length}.
          </p>
        </div>
        {nhapDuoc ? (
          <button
            type="button"
            className="nut-chinh"
            onClick={() => {
              datMoBieuMau((m) => !m);
              ghi.xoaThongBao();
            }}
          >
            {moBieuMau ? 'Đóng biểu mẫu' : 'Thêm nghị quyết'}
          </button>
        ) : (
          <p className="text-[0.9375rem] text-[#4A536B]">
            {duocPhep('nhapNghiQuyet')
              ? 'Máy trạm này chưa kết nối kho nên chưa nhập liệu được.'
              : thieuQuyen('nhapNghiQuyet')}
          </p>
        )}
      </div>

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không ghi được lên kho">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã ghi lên kho">
          {ghi.thanhCong}
        </ThongBao>
      )}

      {moBieuMau && nhapDuoc && (
        <BieuMauNghiQuyet onXong={() => datMoBieuMau(false)} ghi={ghi} />
      )}

      <section aria-labelledby="tieu-de-loc" className="khung p-4">
        <h3 id="tieu-de-loc" className="mb-3 text-lg">
          Tra cứu
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="nhan-truong" htmlFor="loc-tu-khoa">
              Từ khóa
            </label>
            <input
              id="loc-tu-khoa"
              type="search"
              className="o-nhap"
              placeholder="Số, trích yếu, tên đơn vị…"
              value={boLoc.tuKhoa}
              onChange={(e) => dat({ tuKhoa: e.target.value })}
            />
          </div>
          <div>
            <label className="nhan-truong" htmlFor="loc-don-vi">
              Đơn vị
            </label>
            <select
              id="loc-don-vi"
              className="o-nhap"
              value={boLoc.maDonVi}
              onChange={(e) => dat({ maDonVi: e.target.value })}
            >
              <option value={MOI}>Tất cả đơn vị</option>
              {du.donVi.map((d) => (
                <option key={d.ma} value={d.ma}>
                  {d.ten}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="nhan-truong" htmlFor="loc-linh-vuc">
              Lĩnh vực
            </label>
            <select
              id="loc-linh-vuc"
              className="o-nhap"
              value={boLoc.linhVuc}
              onChange={(e) => dat({ linhVuc: e.target.value })}
            >
              <option value={MOI}>Tất cả lĩnh vực</option>
              {Object.entries(NHAN_LINH_VUC).map(([ma, nhan]) => (
                <option key={ma} value={ma}>
                  {nhan}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="nhan-truong" htmlFor="loc-hieu-luc">
              Hiệu lực
            </label>
            <select
              id="loc-hieu-luc"
              className="o-nhap"
              value={boLoc.hieuLuc}
              onChange={(e) => dat({ hieuLuc: e.target.value })}
            >
              <option value={MOI}>Mọi trạng thái</option>
              {Object.entries(NHAN_HIEU_LUC).map(([ma, nhan]) => (
                <option key={ma} value={ma}>
                  {nhan}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(NHAN_LOAI_NGHI_QUYET).map(([ma, nhan]) => (
            <button
              key={ma}
              type="button"
              aria-pressed={boLoc.loai === ma}
              className={boLoc.loai === ma ? 'nut-chinh' : 'nut-phu'}
              onClick={() => dat({ loai: boLoc.loai === ma ? MOI : ma })}
            >
              {nhan}
            </button>
          ))}
          <button type="button" className="nut-phu" onClick={() => datBoLoc(BO_LOC_RONG)}>
            Bỏ hết bộ lọc
          </button>
        </div>
      </section>

      {ketQua.length === 0 ? (
        <ManHinhTrong
          tieuDe={du.nghiQuyet.length === 0 ? 'Chưa có nghị quyết nào' : 'Không có kết quả phù hợp'}
          moTa={
            du.nghiQuyet.length === 0
              ? 'Bắt đầu bằng việc nhập nghị quyết đã ban hành của các xã, phường. Mỗi nghị quyết cần số, ngày ban hành, lĩnh vực và bản PDF đính kèm.'
              : 'Thử nới bộ lọc hoặc bỏ bớt từ khóa.'
          }
        />
      ) : (
        <div className="khung overflow-x-auto">
          <table className="bang">
            <caption className="sr-only">Danh sách nghị quyết</caption>
            <thead>
              <tr>
                <th scope="col">Số, ký hiệu</th>
                <th scope="col">Đơn vị</th>
                <th scope="col">Ngày ban hành</th>
                <th scope="col">Lĩnh vực</th>
                <th scope="col">Trích yếu</th>
                <th scope="col">Hiệu lực</th>
                <th scope="col">Dấu hiệu</th>
                <th scope="col">Tệp</th>
              </tr>
            </thead>
            <tbody>
              {ketQua.map((nq) => (
                <tr key={nq.id}>
                  <td className="so whitespace-nowrap">
                    {nq.so}/{nq.kyHieu}
                  </td>
                  <td>{tenDonVi.get(nq.maDonVi) ?? nq.maDonVi}</td>
                  <td className="so whitespace-nowrap">{hienThiNgay(nq.ngayBanHanh)}</td>
                  <td className="whitespace-nowrap">{NHAN_LINH_VUC[nq.linhVuc]}</td>
                  <td className="trichdan min-w-[24ch] max-w-[52ch]">{nq.trichYeu}</td>
                  <td>
                    <Nhan sac={nq.hieuLuc === 'con_hieu_luc' ? 'dat' : 'trung_tinh'}>
                      {NHAN_HIEU_LUC[nq.hieuLuc]}
                    </Nhan>
                  </td>
                  <td>
                    <DauHieu canhBao={canhBaoTheoId.get(nq.id) ?? []} />
                  </td>
                  <td>
                    {nq.tepDinhKem.length === 0 ? (
                      <span className="text-[#4A536B]">Chưa có</span>
                    ) : (
                      <ul>
                        {nq.tepDinhKem.map((tep) => (
                          <li key={tep}>
                            <a
                              className="underline"
                              href={duongDanTep(tep)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Xem bản PDF
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DauHieu({ canhBao }: { canhBao: ReturnType<typeof phatHienCanhBao> }) {
  if (canhBao.length === 0) {
    return <span className="text-[#4A536B]">Không có</span>;
  }
  const diem = tinhDiemRuiRo(canhBao);
  return (
    <details>
      <summary className="cursor-pointer">
        <Nhan sac={diem >= 40 ? 'canhbao' : 'luuy'}>
          {canhBao.length} dấu hiệu · {diem} điểm
        </Nhan>
      </summary>
      <ul className="mt-2 space-y-1 text-[0.875rem]">
        {canhBao.map((cb, i) => (
          <li key={`${cb.dauHieu}-${i}`}>
            <span className="font-medium">{cb.lyDo}</span>
            <span className="block text-[#4A536B]">
              {cb.viTri.truong}: “{cb.viTri.trichDan}”
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function BieuMauNghiQuyet({
  ghi,
  onXong,
}: {
  ghi: ReturnType<typeof useGhi>;
  onXong: () => void;
}) {
  const du = useDuLieu();
  const [maDonVi, datMaDonVi] = useState(du.donVi[0]?.ma ?? '');
  const [so, datSo] = useState('');
  const [kyHieu, datKyHieu] = useState('NQ-HĐND');
  const [ngayBanHanh, datNgayBanHanh] = useState(tinhHomNay());
  const [kyHop, datKyHop] = useState('');
  const [loai, datLoai] = useState<LoaiNghiQuyet>('quy_pham');
  const [linhVuc, datLinhVuc] = useState<LinhVuc>('ngan_sach');
  const [hieuLuc, datHieuLuc] = useState<HieuLuc>('con_hieu_luc');
  const [trichYeu, datTrichYeu] = useState('');
  const [canCuPhapLy, datCanCuPhapLy] = useState('');
  const [hoSoTrinh, datHoSoTrinh] = useState<string[]>([]);
  const [tep, datTep] = useState<File | null>(null);
  const [loiNhap, datLoiNhap] = useState<string[]>([]);

  const thanhPhanHoSo = du.cauHinhDauHieu.thanhPhanHoSo.batBuoc;

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function guiBieuMau(su: React.FormEvent) {
    su.preventDefault();
    const loi: string[] = [];
    if (!maDonVi) loi.push('Chưa chọn đơn vị ban hành.');
    if (!so.trim()) loi.push('Chưa nhập số nghị quyết.');
    if (!trichYeu.trim()) loi.push('Chưa nhập trích yếu.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayBanHanh)) loi.push('Ngày ban hành chưa hợp lệ.');

    const nam = Number(ngayBanHanh.slice(0, 4));
    const id = `${maDonVi}-${so.trim()}-${nam}`;
    if (du.nghiQuyet.some((nq) => nq.id === id)) {
      loi.push(`Nghị quyết "${id}" đã có trong cơ sở dữ liệu. Kiểm tra lại số và đơn vị.`);
    }
    if (nam !== du.cauHinh.namLamViec) {
      loi.push(
        `Ngày ban hành thuộc năm ${nam} nhưng hệ thống đang làm việc với năm ${du.cauHinh.namLamViec}. Đổi năm làm việc trong data/cauhinh.json trước khi nhập.`,
      );
    }
    datLoiNhap(loi);
    if (loi.length > 0) return;

    const thanhCong = await ghi.chay(async () => {
      const tepDinhKem: string[] = [];
      if (tep) {
        const duongDan = `data/files/${nam}/${id}.pdf`;
        await taiTepLen(kho, duongDan, tep, `nghiQuyet: tải bản PDF của ${id}`);
        tepDinhKem.push(duongDan);
      }
      const banGhi: KieuNghiQuyet = {
        id,
        maDonVi,
        so: so.trim(),
        kyHieu: kyHieu.trim(),
        ngayBanHanh,
        kyHop: kyHop.trim(),
        loai,
        linhVuc,
        trichYeu: trichYeu.trim(),
        hieuLuc,
        canCuPhapLy: canCuPhapLy
          .split('\n')
          .map((d) => d.trim())
          .filter((d) => d.length > 0),
        hoSoTrinh,
        tepDinhKem,
        ngayCapNhat: tinhHomNay(),
      };
      const danhSach = [...du.nghiQuyet, banGhi].sort((a, b) =>
        a.ngayBanHanh < b.ngayBanHanh ? 1 : -1,
      );
      await ghiJson(
        kho,
        `data/nghiquyet/${nam}.json`,
        danhSach,
        `nghiQuyet: thêm ${id} của ${maDonVi}`,
      );
      return `Đã thêm nghị quyết ${id}. Trang sẽ hiển thị bản mới sau khi GitHub Pages phát hành lại (thường 1–2 phút).`;
    });

    if (thanhCong) onXong();
  }

  return (
    <form onSubmit={guiBieuMau} className="khung space-y-4 p-4">
      <h3 className="text-lg">Thêm nghị quyết</h3>

      {loiNhap.length > 0 && (
        <ThongBao loai="loi" tieuDe="Chưa gửi được, còn thiếu thông tin">
          <ul className="list-disc pl-5">
            {loiNhap.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </ThongBao>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="nhan-truong" htmlFor="nq-don-vi">
            Đơn vị ban hành
          </label>
          <select
            id="nq-don-vi"
            className="o-nhap"
            value={maDonVi}
            onChange={(e) => datMaDonVi(e.target.value)}
          >
            {du.donVi.map((d) => (
              <option key={d.ma} value={d.ma}>
                {d.ten}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-so">
            Số
          </label>
          <input
            id="nq-so"
            className="o-nhap so"
            value={so}
            onChange={(e) => datSo(e.target.value)}
            placeholder="12"
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-ky-hieu">
            Ký hiệu
          </label>
          <input
            id="nq-ky-hieu"
            className="o-nhap"
            value={kyHieu}
            onChange={(e) => datKyHieu(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-ngay">
            Ngày ban hành
          </label>
          <input
            id="nq-ngay"
            type="date"
            className="o-nhap so"
            value={ngayBanHanh}
            onChange={(e) => datNgayBanHanh(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-ky-hop">
            Kỳ họp
          </label>
          <input
            id="nq-ky-hop"
            className="o-nhap"
            value={kyHop}
            onChange={(e) => datKyHop(e.target.value)}
            placeholder="Kỳ họp thứ 5"
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-loai">
            Loại văn bản
          </label>
          <select
            id="nq-loai"
            className="o-nhap"
            value={loai}
            onChange={(e) => datLoai(e.target.value as LoaiNghiQuyet)}
          >
            {Object.entries(NHAN_LOAI_NGHI_QUYET).map(([ma, nhan]) => (
              <option key={ma} value={ma}>
                {nhan}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-linh-vuc">
            Lĩnh vực
          </label>
          <select
            id="nq-linh-vuc"
            className="o-nhap"
            value={linhVuc}
            onChange={(e) => datLinhVuc(e.target.value as LinhVuc)}
          >
            {Object.entries(NHAN_LINH_VUC).map(([ma, nhan]) => (
              <option key={ma} value={ma}>
                {nhan}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-hieu-luc">
            Hiệu lực
          </label>
          <select
            id="nq-hieu-luc"
            className="o-nhap"
            value={hieuLuc}
            onChange={(e) => datHieuLuc(e.target.value as HieuLuc)}
          >
            {Object.entries(NHAN_HIEU_LUC).map(([ma, nhan]) => (
              <option key={ma} value={ma}>
                {nhan}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="nq-tep">
            Bản PDF (tối đa 10 MB)
          </label>
          <input
            id="nq-tep"
            type="file"
            accept="application/pdf"
            className="o-nhap"
            onChange={(e) => datTep(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div>
        <label className="nhan-truong" htmlFor="nq-trich-yeu">
          Trích yếu
        </label>
        <textarea
          id="nq-trich-yeu"
          className="o-nhap trichdan min-h-[6rem]"
          value={trichYeu}
          onChange={(e) => datTrichYeu(e.target.value)}
          placeholder="Về việc…"
        />
      </div>

      <div>
        <label className="nhan-truong" htmlFor="nq-can-cu">
          Căn cứ pháp lý viện dẫn trong văn bản — mỗi căn cứ một dòng
        </label>
        <textarea
          id="nq-can-cu"
          className="o-nhap trichdan min-h-[5rem]"
          value={canCuPhapLy}
          onChange={(e) => datCanCuPhapLy(e.target.value)}
          placeholder={'Căn cứ Luật Tổ chức chính quyền địa phương;\nCăn cứ Nghị định số …;'}
        />
        <p className="mt-1 text-[0.875rem] text-[#4A536B]">
          Hệ thống đối chiếu các căn cứ này với danh mục văn bản đã hết hiệu lực và với tên cơ
          quan không còn đúng sau sắp xếp 01/7/2025, để phát hiện dấu hiệu cần rà soát.
        </p>
      </div>

      <fieldset>
        <legend className="nhan-truong">Thành phần hồ sơ trình đã có</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {thanhPhanHoSo.map((tp) => (
            <label key={tp.ma} className="flex items-start gap-2 text-[0.9375rem]">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={hoSoTrinh.includes(tp.ma)}
                onChange={(e) =>
                  datHoSoTrinh((cu) =>
                    e.target.checked ? [...cu, tp.ma] : cu.filter((m) => m !== tp.ma),
                  )
                }
              />
              {tp.ten}
            </label>
          ))}
        </div>
        <p className="mt-1 text-[0.875rem] text-[#4A536B]">
          Thiếu thành phần bắt buộc sẽ sinh dấu hiệu cảnh báo cho văn bản quy phạm pháp luật.
        </p>
      </fieldset>

      <p className="text-[0.9375rem] text-[#4A536B]">
        Nội dung nhập ở đây sẽ được commit công khai vào kho{' '}
        <span className="so">
          {kho.chuKho}/{kho.tenKho}
        </span>
        . Không nhập thông tin cá nhân của công dân hay nội dung thuộc phạm vi bí mật nhà nước.
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="nut-chinh" disabled={ghi.dangGhi}>
          {ghi.dangGhi ? 'Đang ghi lên kho…' : 'Lưu nghị quyết'}
        </button>
        <button type="button" className="nut-phu" onClick={onXong} disabled={ghi.dangGhi}>
          Hủy
        </button>
      </div>
    </form>
  );
}
