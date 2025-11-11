import { useEffect } from "react";
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
import { GENDER_OPTIONS, RT_OPTIONS } from "@/lib/constants"; // Import RT_OPTIONS

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
  // NIK Bayi wajib diisi untuk masuk ke tabel warga
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
});

type FormData = z.infer<typeof formSchema>;

interface KelahiranFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelahiran: any;
  onSuccess: () => void;
}

export function KelahiranFormDialog({ open, onOpenChange, kelahiran, onSuccess }: KelahiranFormDialogProps) {
  const { toast } = useToast();
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
      alamat: "", // Tambahan
      rt: "",       // Tambahan
      agama: "",    // Tambahan
      keterangan: "",
    },
  });

  useEffect(() => {
    if (kelahiran) {
      form.reset({
        nama_bayi: kelahiran.nama_bayi || "",
        nik_bayi: kelahiran.nik_bayi || "",
        jenis_kelamin: kelahiran.jenis_kelamin || "Laki-laki",
        tanggal_lahir: kelahiran.tanggal_lahir || "",
        tempat_lahir: kelahiran.tempat_lahir || "",
        nama_ayah: kelahiran.nama_ayah || "",
        nama_ibu: kelahiran.nama_ibu || "",
        keterangan: kelahiran.keterangan || "",
        // Asumsi data ini tidak di-edit dari form kelahiran
        alamat: "",
        rt: "",
        agama: "",
      });
    } else {
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
      });
    }
  }, [kelahiran, form]);

  const onSubmit = async (data: FormData) => {
    // Mode edit tidak didukung untuk auto-insert ke tabel warga
    // karena akan rumit. Asumsikan form ini hanya untuk 'Tambah Baru'
    // jika menyangkut insert ke tabel warga.
    if (kelahiran) {
      toast({ title: "Error", description: "Mode edit belum didukung untuk sinkronisasi warga", variant: "destructive" });
      return;
    }

    try {
      // 1. Insert ke laporan_kelahiran
      const submitLaporan: any = {
        nama_bayi: data.nama_bayi,
        nik_bayi: data.nik_bayi, // Wajib ada
        jenis_kelamin: data.jenis_kelamin,
        tanggal_lahir: data.tanggal_lahir,
        tempat_lahir: data.tempat_lahir,
        nama_ayah: data.nama_ayah,
        nama_ibu: data.nama_ibu,
        keterangan: data.keterangan || null,
      };

      const { error: laporanError } = await supabase.from("laporan_kelahiran").insert([submitLaporan]);
      if (laporanError) throw laporanError;

      // 2. Insert ke tabel warga
      const submitWarga: any = {
        nama: data.nama_bayi,
        nik: data.nik_bayi,
        tempat_lahir: data.tempat_lahir,
        tanggal_lahir: data.tanggal_lahir,
        jenis_kelamin: data.jenis_kelamin,
        alamat: data.alamat,
        rt: data.rt,
        agama: data.agama,
        status_perkawinan: "Belum Kawin", // Default untuk bayi
        status_kehidupan: "Hidup", // Default untuk data baru
        // Kolom 'rw' dan 'kewarganegaraan' akan memakai DEFAULT dari DB
      };
      
      const { error: wargaError } = await supabase.from("warga").insert([submitWarga]);
      
      if (wargaError) {
        // Jika gagal insert warga (misal NIK duplikat), beri pesan
        throw new Error(`Laporan kelahiran berhasil, tapi gagal menambah ke data warga: ${wargaError.message}`);
      }
      
      toast({ title: "Berhasil", description: "Data kelahiran DAN data warga baru berhasil ditambahkan" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kelahiran ? "Edit" : "Tambah"} Laporan Kelahiran</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_bayi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bayi *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!kelahiran} />
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
                      <Input {...field} maxLength={16} disabled={!!kelahiran} />
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!kelahiran}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="tanggal_lahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!!kelahiran} />
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
                    <Input {...field} disabled={!!kelahiran} />
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
                    <FormLabel>Nama Ayah *</FormLabel>
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
                    <FormLabel>Nama Ibu *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* --- FIELD BARU UNTUK WARGA --- */}
            {!kelahiran && ( // Hanya tampilkan field ini saat 'Tambah Baru'
              <>
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
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
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
              <Button type="submit">{kelahiran ? "Perbarui" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}