import { useEffect, useState } from "react";
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

const formSchema = z.object({
  warga_id: z.string().min(1, "Warga harus dipilih"),
  tanggal_meninggal: z.string().min(1, "Tanggal meninggal harus diisi"),
  tempat_meninggal: z.string().min(1, "Tempat meninggal harus diisi"),
  sebab_kematian: z.string().optional(),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface KematianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kematian: any;
  onSuccess: () => void;
}

type WargaLite = {
  id: string;
  nama: string;
  nik: string;
};

export function KematianFormDialog({ open, onOpenChange, kematian, onSuccess }: KematianFormDialogProps) {
  const { toast } = useToast();
  const [wargaList, setWargaList] = useState<WargaLite[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warga_id: "",
      tanggal_meninggal: "",
      tempat_meninggal: "",
      sebab_kematian: "",
      keterangan: "",
    },
  });

  // Fetch data warga yang masih hidup saat dialog dibuka
  useEffect(() => {
    async function fetchWargaHidup() {
      if (!open) return;
      
      const { data, error } = await supabase
        .from("warga")
        .select("id, nama, nik")
        .eq("status_kehidupan", "Hidup") // Hanya ambil yang masih hidup
        .order("nama", { ascending: true });
        
      if (error) {
        toast({ title: "Error", description: "Gagal mengambil data warga", variant: "destructive" });
      } else {
        setWargaList(data || []);
      }
    }
    
    fetchWargaHidup();
  }, [open, toast]);

  useEffect(() => {
    if (kematian) {
      form.reset({
        warga_id: kematian.warga_id || "",
        tanggal_meninggal: kematian.tanggal_meninggal || "",
        tempat_meninggal: kematian.tempat_meninggal || "",
        sebab_kematian: kematian.sebab_kematian || "",
        keterangan: kematian.keterangan || "",
      });
    } else {
      form.reset({
        warga_id: "",
        tanggal_meninggal: "",
        tempat_meninggal: "",
        sebab_kematian: "",
        keterangan: "",
      });
    }
  }, [kematian, form]);

  const onSubmit = async (data: FormData) => {
    try {
      // Dapatkan data warga yang dipilih dari state
      const selectedWarga = wargaList.find(w => w.id === data.warga_id);
      
      // Jika mode 'Tambah Baru', warga wajib ada di list
      if (!selectedWarga && !kematian) {
         throw new Error("Warga yang dipilih tidak valid");
      }

      // Jika mode 'Edit', ambil nama & NIK dari data 'kematian' prop
      // Jika mode 'Tambah Baru', ambil dari 'selectedWarga'
      const namaAlmarhum = kematian ? kematian.nama_almarhum : selectedWarga!.nama;
      const nikAlmarhum = kematian ? kematian.nik : selectedWarga!.nik;

      const submitData: any = {
        warga_id: data.warga_id,
        nama_almarhum: namaAlmarhum,
        nik: nikAlmarhum,
        tanggal_meninggal: data.tanggal_meninggal,
        tempat_meninggal: data.tempat_meninggal,
        sebab_kematian: data.sebab_kematian || null,
        keterangan: data.keterangan || null,
      };

      if (kematian) {
        // Mode Edit: Hanya update laporan kematian
        const { error } = await supabase
          .from("laporan_kematian")
          .update(submitData)
          .eq("id", kematian.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data kematian berhasil diperbarui" });
      } else {
        // Mode Tambah Baru:
        // 1. Insert ke laporan_kematian
        const { error: laporError } = await supabase.from("laporan_kematian").insert([submitData]);
        if (laporError) throw laporError;

        // 2. Update status di tabel warga
        const { error: updateWargaError } = await supabase
          .from("warga")
          .update({ 
            status_kehidupan: "Meninggal",
            tanggal_meninggal: data.tanggal_meninggal
          })
          .eq("id", data.warga_id);

        if (updateWargaError) {
          // Laporan berhasil dibuat, tapi update warga gagal (user harus tahu)
          throw new Error(`Laporan kematian berhasil dibuat, tapi gagal update status warga: ${updateWargaError.message}`);
        }
        
        toast({ title: "Berhasil", description: "Data kematian berhasil ditambahkan" });
      }
      
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
          <DialogTitle>{kematian ? "Edit" : "Tambah"} Laporan Kematian</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="warga_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Almarhum (Warga) *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!!kematian} // Disable ganti warga jika mode edit
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih warga yang meninggal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wargaList.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.nama} (NIK: {w.nik})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tanggal_meninggal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Meninggal *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tempat_meninggal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Meninggal *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sebab_kematian"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sebab Kematian</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit">{kematian ? "Perbarui" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}