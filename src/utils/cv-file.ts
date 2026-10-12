export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateCvFile(file: { name: string; size?: number; mimeType?: string }): string | null {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension !== 'pdf' && extension !== 'docx') {
    return 'اختر ملف PDF أو Word بصيغة DOCX.';
  }
  if (file.size !== undefined && (!Number.isFinite(file.size) || file.size <= 0)) {
    return 'الملف فارغ أو حجمه غير صالح. اختر ملفًا آخر.';
  }
  if (file.size !== undefined && file.size > CV_MAX_BYTES) {
    return 'حجم الملف أكبر من 10 ميجابايت. اختر نسخة أصغر.';
  }
  const expected = extension === 'pdf' ? CV_MIME_TYPES[0] : CV_MIME_TYPES[1];
  if (file.mimeType && file.mimeType !== 'application/octet-stream' && file.mimeType !== expected) {
    return 'نوع الملف لا يطابق امتداده. اختر نسخة PDF أو DOCX سليمة.';
  }
  return null;
}

export function formatCvSize(size?: number): string {
  if (size === undefined) return 'الحجم غير متوفر';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(1)} ميجابايت`;
}
