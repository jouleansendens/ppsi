export const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

export const RELIGION_OPTIONS = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Konghucu", label: "Konghucu" },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: "Belum Kawin", label: "Belum Kawin" },
  { value: "Kawin", label: "Kawin" },
  { value: "Cerai Hidup", label: "Cerai Hidup" },
  { value: "Cerai Mati", label: "Cerai Mati" },
];

export const RT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1).padStart(3, "0"),
  label: `RT ${String(i + 1).padStart(3, "0")}`,
}));

export const EDUCATION_OPTIONS = [
  { value: "Tidak/Belum Sekolah", label: "Tidak/Belum Sekolah" },
  { value: "SD", label: "SD" },
  { value: "SLTP/SMP", label: "SLTP/SMP" },
  { value: "SLTA/SMA", label: "SLTA/SMA" },
  { value: "Diploma", label: "Diploma" },
  { value: "Sarjana (S1)", label: "Sarjana (S1)" },
  { value: "Magister (S2)", label: "Magister (S2)" },
  { value: "Doktor (S3)", label: "Doktor (S3)" },
];

// --- PERUBAHAN DI SINI ---
// Opsi yang lain telah dihapus sesuai permintaan Anda
export const FAMILY_RELATION_OPTIONS = [
  { value: "Kepala Keluarga", label: "Kepala Keluarga" },
  { value: "Istri", label: "Istri" },
  { value: "Anak", label: "Anak" },
];