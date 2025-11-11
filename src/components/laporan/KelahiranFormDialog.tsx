import { useEffect, useState } from "react"; // Import useState
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GENDER_OPTIONS, RT_OPTIONS } from "@/lib/constants";

// Ambil dari skema DB
const RELIGION_OPTIONS = [
  { value: "Islam", label: "Islam" },
  { value: "Kristen", label: "Kristen" },
  { value: "Katolik", label: "Katolik" },
  { value: "Hindu", label: "Hindu" },
  { value: "Buddha", label: "Buddha" },
  { value: "Konghucu", label: "Konghucu" },
];

const formSchema = z.object({
  nama_bayi: z.string().min(1, "Nama bayi harus diisi"),
  nik_bayi: z.string().min(16, "NIK harus 16 digit").max(16, "NIK harus 16 digit"),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]),
  tanggal_lahir: z.string().min(1, "Tanggal lahir harus diisi"),
  tempat_lahir: z.string().min(1, "Tempat lahir harus diisi"),
  nama_ayah: z.string().min(1, "Nama ayah harus diisi"),
  nama_ibu: z.string().min(1, "Nama ibu harus diisi"),
  // Field tambahan untuk tabel warga
  alamat: z.string().min(1, "Alamat harus diisi"),
  rt: z.string().min(1, "RT harus dipilih"),
  agama: z.string().min(1, "Agama harus dipilih"),
  keterangan: z.string().optional(),
  
  // Field baru untuk integrasi KK
  keluarga_id: z.string().min(1, "Kartu Keluarga harus dipilih"),
  hubungan_keluarga: z.string().min(1, "Hubungan keluarga harus diisi"),
});

type FormData = z.infer<typeof formSchema>;

interface KelahiranFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelahiran: any;
  onSuccess: () => void;
}

// Tipe baru untuk daftar KK
type KeluargaLite = {
  id: string;
  nomor_kk: string;
  kepala_keluarga: {
    nama: string;
  }
};

export function KelahiranFormDialog({ open, onOpenChange, kelahiran, onSuccess }: KelahiranFormDialogProps) {
  const { toast } = useToast();
  const [keluargaList, setKeluargaList] = useState<KeluargaLite[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_bayi: "",
      nik_bayi: "",
      jenis_kelamin: "Laki-laki",
      tanggal_lahir: "",
      tempat_lahir: "",
      nama_ayah: "",
      nama_ibu: "",
      alamat: "",
      rt: "",
      agama: "",
      keterangan: "",
      keluarga_id: "",
      hubungan_keluarga: "Anak", // Default
    },
  });

  // Ambil daftar KK saat dialog dibuka
  useEffect(() => {
    async function fetchKeluarga() {
      if (!open || (open && kelahiran)) return; // Hanya fetch saat tambah baru

      const { data, error } = await supabase
        .from("keluarga")
        .select(`
          id,
          nomor_kk,
          kepala_keluarga:warga!keluarga_kepala_keluarga_id_fkey (nama)
        `)
        .order("nomor_kk", { ascending: true });

      if (error) {
        toast({ title: "Error", description: "Gagal mengambil daftar KK", variant: "destructive" });
      } else {
        setKeluargaList(data as KeluargaLite[]);
      }
    }
    
    fetchKeluarga();
  }, [open, kelahiran, toast]);


  useEffect(() => {
    if (kelahiran) {
      // Mode edit, nonaktifkan integrasi (terlalu rumit untuk di-edit)
      form.reset({
        nama_bayi: kelahiran.nama_bayi || "",
        nik_bayi: kelahiran.nik_bayi || "",
        jenis_kelamin: kelahiran.jenis_kelamin || "Laki-laki",
        tanggal_lahir: kelahiran.tanggal_lahir || "",
        tempat_lahir: kelahiran.tempat_lahir || "",
        nama_ayah: kelahiran.nama_ayah || "",
        nama_ibu: kelahiran.nama_ibu || "",
        keterangan: kelahiran.keterangan || "",
      });
    } else {
      // Mode tambah baru
      form.reset({
        nama_bayi: "",
        nik_bayi: "",
        jenis_kelamin: "Laki-laki",
        tanggal_lahir: "",
        tempat_lahir: "",
        nama_ayah: "",
        nama_ibu: "",
        alamat: "",
        rt: "",
        agama: "",
        keterangan: "",
        keluarga_id: "",
        hubungan_keluarga: "Anak",
      });
    }
  }, [kelahiran, form]);

  const onSubmit = async (data: FormData) => {
    if (kelahiran) {
      toast({ title: "Info", description: "Edit laporan kelahiran belum mendukung update data warga/KK." });
      // Logika edit sederhana (jika diperlukan) bisa ditambahkan di sini
      onOpenChange(false);
      return;
    }

    try {
      // 1. Insert ke laporan_kelahiran
      const submitLaporan: any = {
        nama_bayi: data.nama_bayi,
        nik_bayi: data.nik_bayi,
        jenis_kelamin: data.jenis_kelamin,
        tanggal_lahir: data.tanggal_lahir,
        tempat_lahir: data.tempat_lahir,
        nama_ayah: data.nama_ayah,
        nama_ibu: data.nama_ibu,
        keterangan: data.keterangan || null,
      };
      const { error: laporanError } = await supabase.from("laporan_kelahiran").insert([submitLaporan]);
      if (laporanError) throw new Error(`Gagal simpan laporan: ${laporanError.message}`);

      // 2. Insert ke tabel warga dan ambil ID-nya
      const submitWarga: any = {
        nama: data.nama_bayi,
        nik: data.nik_bayi,
        tempat_lahir: data.tempat_lahir,
        tanggal_lahir: data.tanggal_lahir,
        jenis_kelamin: data.jenis_kelamin,
        alamat: data.alamat,
        rt: data.rt,
        agama: data.agama,
        status_perkawinan: "Belum Kawin",
        status_kehidupan: "Hidup",
      };
      
      const { data: newWargaData, error: wargaError } = await supabase
        .from("warga")
        .insert([submitWarga])
        .select("id") // <-- Ambil ID dari warga yang baru dibuat
        .single(); // <-- Pastikan hanya 1 data yang kembali

      if (wargaError) {
        throw new Error(`Gagal menambah data warga: ${wargaError.message}`);
      }
      if (!newWargaData) {
        throw new Error("Gagal mendapatkan ID warga baru setelah insert.");
      }

      const newWargaId = newWargaData.id;

      // 3. Insert ke tabel anggota_keluarga
      const submitAnggotaKeluarga = {
        keluarga_id: data.keluarga_id,
        warga_id: newWargaId,
        hubungan_keluarga: data.hubungan_keluarga,
      };

      const { error: anggotaError } = await supabase.from("anggota_keluarga").insert([submitAnggotaKeluarga]);
      if (anggotaError) {
        throw new Error(`Gagal menambah warga ke KK: ${anggotaError.message}`);
      }
      
      toast({ title: "Berhasil!", description: "Data kelahiran, warga, dan anggota KK berhasil ditambahkan." });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const isEditMode = !!kelahiran;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Tambah"} Laporan Kelahiran</DialogTitle>
          {!isEditMode && <p className="text-sm text-muted-foreground">Mode tambah akan otomatis mendaftarkan bayi ke Data Warga dan Kartu Keluarga.</p>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ... (Field Nama Bayi, NIK, Jenis Kelamin, Tgl Lahir, Tempat Lahir, Nama Ayah, Nama Ibu tetap sama) ... */}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_bayi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bayi *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nik_bayi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK Bayi *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={16} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jenis_kelamin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tanggal_lahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tempat_lahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_ayah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ayah (Laporan) *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama_ibu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Ibu (Laporan) *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- FIELD BARU UNTUK WARGA & KK (Hanya mode Tambah) --- */}
            {!isEditMode && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium">Data Kependudukan</h3>
                  <p className="text-sm text-muted-foreground">Isi data untuk mendaftarkan bayi ke Data Warga & KK.</p>
                </div>

                <FormField
                  control={form.control}
                  name="keluarga_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Kartu Keluarga (KK) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih KK..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {keluargaList.map((kk) => (
                            <SelectItem key={kk.id} value={kk.id}>
                              {kk.nomor_kk} (Kepala Keluarga: {kk.kepala_keluarga?.nama || "N/A"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hubungan_keluarga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hubungan dalam Keluarga *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat (Sesuai KK) *</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RT *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih RT" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agama *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Agama" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RELIGION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            {/* --- AKHIR FIELD BARU --- */}

            <FormField
              control={form.control}
              name="keterangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
Batal
              </Button>
              <Button type="submit">{isEditMode ? "Perbarui" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}