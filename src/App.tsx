import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CungCapKho, useDuLieu } from './dulieu/khoDuLieu';
import { usePhien } from './dulieu/usePhien';
import BoCuc from './thanhphan/BoCuc';
import ChoDuLieu from './thanhphan/ChoDuLieu';
import ManHinhDangNhap from './thanhphan/ManHinhDangNhap';
import TongQuan from './trang/TongQuan';
import KhungNghiepVu from './trang/KhungNghiepVu';
import NghiQuyet from './trang/NghiQuyet';
import DanhMucRaSoat from './trang/DanhMucRaSoat';
import ThamDinh from './trang/ThamDinh';
import TheoDoiSauGiamSat from './trang/TheoDoiSauGiamSat';
import HoSoGiamSat from './trang/HoSoGiamSat';
import HoiDap from './trang/HoiDap';
import QuanTri from './trang/QuanTri';

function CongVao({ children }: { children: ReactNode }) {
  const du = useDuLieu();
  const { daDangNhap } = usePhien();
  if (!daDangNhap) return <ManHinhDangNhap khoTaiKhoan={du.khoTaiKhoan} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <CungCapKho>
      <ChoDuLieu>
        <CongVao>
          <HashRouter>
            <Routes>
              <Route element={<BoCuc />}>
                <Route index element={<TongQuan />} />
                <Route path="khung-nghiep-vu" element={<KhungNghiepVu />} />
                <Route path="nghi-quyet" element={<NghiQuyet />} />
                <Route path="danh-muc-ra-soat" element={<DanhMucRaSoat />} />
                <Route path="tham-dinh" element={<ThamDinh />} />
                <Route path="theo-doi-sau-giam-sat" element={<TheoDoiSauGiamSat />} />
                <Route path="ho-so-giam-sat" element={<HoSoGiamSat />} />
                <Route path="hoi-dap" element={<HoiDap />} />
                <Route path="quan-tri" element={<QuanTri />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </CongVao>
      </ChoDuLieu>
    </CungCapKho>
  );
}
