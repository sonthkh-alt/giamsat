import { readFileSync } from 'node:fs';
import { pbkdf2Sync } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bamMatKhau } from './xacThuc';
import type { KhoTaiKhoan } from '../kieu';

const GOC = resolve(__dirname, '../..');
const kho = JSON.parse(
  readFileSync(resolve(GOC, 'data/nguoidung.json'), 'utf8'),
) as KhoTaiKhoan;

function bamBangNode(matKhau: string, muoiHex: string, soVongLap: number): string {
  return pbkdf2Sync(
    Buffer.from(matKhau.normalize('NFC'), 'utf8'),
    Buffer.from(muoiHex, 'hex'),
    soVongLap,
    32,
    'sha256',
  ).toString('hex');
}

describe('tham số băm mật khẩu', () => {
  it('dùng PBKDF2-SHA256 với số vòng lặp đủ lớn', () => {
    expect(kho.thamSoBam.thuatToan).toBe('PBKDF2-SHA256');
    expect(kho.thamSoBam.soVongLap).toBeGreaterThanOrEqual(210000);
  });
});

describe('bamMatKhau trong trình duyệt khớp với công cụ cấp tài khoản', () => {
  it('cùng mật khẩu và muối cho cùng chuỗi băm', async () => {
    const muoi = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const soVongLap = kho.thamSoBam.soVongLap;
    const trinhDuyet = await bamMatKhau('MatKhau@Thu#2026', muoi, soVongLap);
    expect(trinhDuyet).toBe(bamBangNode('MatKhau@Thu#2026', muoi, soVongLap));
  });

  it('muối khác cho chuỗi băm khác', async () => {
    const soVongLap = kho.thamSoBam.soVongLap;
    const a = await bamMatKhau('MatKhau@Thu#2026', '00'.repeat(16), soVongLap);
    const b = await bamMatKhau('MatKhau@Thu#2026', '11'.repeat(16), soVongLap);
    expect(a).not.toBe(b);
  });

  it('chuẩn hóa Unicode để mật khẩu tiếng Việt gõ kiểu nào cũng khớp', async () => {
    const muoi = '00'.repeat(16);
    const soVongLap = kho.thamSoBam.soVongLap;
    const dungSan = await bamMatKhau('MậtKhẩuTiếngViệt', muoi, soVongLap);
    const toHop = await bamMatKhau('MậtKhẩuTiếngViệt'.normalize('NFD'), muoi, soVongLap);
    expect(dungSan).toBe(toHop);
  });
});

describe('kho tài khoản kèm kho mã nguồn', () => {
  it('có ít nhất một tài khoản quản trị đang hoạt động', () => {
    const quanTri = kho.taiKhoan.filter((t) => t.vaiTro === 'quan_tri' && t.hoatDong);
    expect(quanTri.length).toBeGreaterThan(0);
  });

  it('tên đăng nhập không trùng nhau và đã chuẩn hóa chữ thường', () => {
    const ten = kho.taiKhoan.map((t) => t.tenDangNhap);
    expect(new Set(ten).size).toBe(ten.length);
    for (const t of ten) expect(t).toBe(t.toLowerCase());
  });

  it('không lưu mật khẩu gốc, chỉ lưu muối và chuỗi băm đúng độ dài', () => {
    for (const t of kho.taiKhoan) {
      expect(t.muoi).toMatch(/^[0-9a-f]{32}$/);
      expect(t.bam).toMatch(/^[0-9a-f]{64}$/);
      expect(Object.keys(t)).not.toContain('matKhau');
    }
  });

  it('mỗi tài khoản dùng một muối riêng', () => {
    const muoi = kho.taiKhoan.map((t) => t.muoi);
    expect(new Set(muoi).size).toBe(muoi.length);
  });

  it('mọi tài khoản đều khai họ tên và ngày cấp', () => {
    for (const t of kho.taiKhoan) {
      expect(t.hoTen.trim().length).toBeGreaterThan(0);
      expect(t.ngayCap).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
