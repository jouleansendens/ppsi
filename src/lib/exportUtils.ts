import * as XLSX from "xlsx";

interface ExportKeluargaData {
  nomor_kk: string;
  kepala_keluarga: string;
  rt: string;
  rw: string;
  alamat: string;
  anggota: Array<{
    nama: string;
    nik: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
    hubungan_keluarga: string;
    pekerjaan: string;
    pendidikan: string;
  }>;
}

export const exportKeluargaToExcel = (data: ExportKeluargaData[], filename: string = "Data_Keluarga") => {
  const workbook = XLSX.utils.book_new();

  data.forEach((keluarga) => {
    const sheetData = [
      ["KARTU KELUARGA"],
      [""],
      ["No. KK", keluarga.nomor_kk],
      ["Kepala Keluarga", keluarga.kepala_keluarga],
      ["Alamat", keluarga.alamat],
      ["RT/RW", `${keluarga.rt}/${keluarga.rw}`],
      [""],
      ["DAFTAR ANGGOTA KELUARGA"],
      ["No", "Nama", "NIK", "Jenis Kelamin", "Tanggal Lahir", "Hubungan", "Pekerjaan", "Pendidikan"],
    ];

    keluarga.anggota.forEach((anggota, index) => {
      sheetData.push([
        (index + 1).toString(),
        anggota.nama,
        anggota.nik,
        anggota.jenis_kelamin === "male" ? "Laki-laki" : "Perempuan",
        new Date(anggota.tanggal_lahir).toLocaleDateString("id-ID"),
        anggota.hubungan_keluarga,
        anggota.pekerjaan || "-",
        anggota.pendidikan || "-",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
    ];

    // Add worksheet to workbook with sheet name as KK number (limited to 31 chars)
    const sheetName = keluarga.nomor_kk.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportSingleKeluargaToExcel = (keluarga: ExportKeluargaData) => {
  exportKeluargaToExcel([keluarga], `KK_${keluarga.nomor_kk}`);
};

interface ExportWargaData {
  no: number;
  nik: string;
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  umur: number;
  alamat: string;
  rt: string;
  agama: string;
  status_perkawinan: string;
  pekerjaan: string;
  pendidikan: string;
}

export const exportWargaToExcel = (data: ExportWargaData[], filename: string = "Data_Warga") => {
  const workbook = XLSX.utils.book_new();

  const sheetData = [
    ["DATA WARGA RW 08"],
    [""],
    [
      "No",
      "NIK",
      "Nama",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "Umur",
      "Alamat",
      "RT",
      "Agama",
      "Status Perkawinan",
      "Pekerjaan",
      "Pendidikan",
    ],
  ];

  data.forEach((warga) => {
    sheetData.push([
      warga.no.toString(),
      warga.nik,
      warga.nama,
      warga.jenis_kelamin,
      warga.tanggal_lahir,
      warga.umur.toString(),
      warga.alamat,
      warga.rt,
      warga.agama,
      warga.status_perkawinan,
      warga.pekerjaan || "-",
      warga.pendidikan || "-",
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 8 },
    { wch: 35 },
    { wch: 8 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Warga");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
