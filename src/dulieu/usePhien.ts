import { useSyncExternalStore } from 'react';
import { coToken, layNguoiDung, theoDoiPhien } from './phienLamViec';

/**
 * Trạng thái phiên làm việc, dùng để bật/tắt các nút ghi dữ liệu.
 *
 * Lưu ý về giới hạn: trang tĩnh không có máy chủ nên KHÔNG có phân quyền thật.
 * Việc có mã truy cập chỉ nói lên người dùng ghi được lên kho, không thay thế
 * cho kiểm soát truy cập. Nội dung thực sự cần bảo mật không được đặt ở đây.
 */
export function usePhien(): { coQuyenGhi: boolean; nguoiDung: string } {
  const coQuyenGhi = useSyncExternalStore(theoDoiPhien, coToken, () => false);
  const nguoiDung = useSyncExternalStore(
    theoDoiPhien,
    layNguoiDung,
    () => '',
  );
  return { coQuyenGhi, nguoiDung };
}
