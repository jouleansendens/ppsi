import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GENDER_OPTIONS, RELIGION_OPTIONS, MARITAL_STATUS_OPTIONS, RT_OPTIONS, EDUCATION_OPTIONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const wargaSchema = z.object({
  nik: z.string().min(16, "NIK harus 16 digit").max(16, "NIK harus 16 digit"),
  nama: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  tempat_lahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggal_lahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  rt: z.string().min(1, "RT wajib diisi"),
  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]),
  status_perkawinan: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]),
  pekerjaan: z.string().optional(),
  pendidikan: z.string().optional(),
  kewarganegaraan: z.string().default("Indonesia"),
});

type WargaFormValues = z.infer<typeof wargaSchema>;

interface WargaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warga?: any;
  onSuccess: () => void;
}

export function WargaFormDialog({ open, onOpenChange, warga, onSuccess }: WargaFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEdit = !!warga;

  const form = useForm<WargaFormValues>({
    resolver: zodResolver(wargaSchema),
    defaultValues: {
      nik: "",
      nama: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jenis_kelamin: "Laki-laki",
      alamat: "",
      rt: "001",
      agama: "Islam",
      status_perkawinan: "Belum Kawin",
      pekerjaan: "",
      pendidikan: "",
      kewarganegaraan: "Indonesia",
    },
  });

  useEffect(() => {
    if (warga) {
      form.reset({
        nik: warga.nik,
        nama: warga.nama,
        tempat_lahir: warga.tempat_lahir,
        tanggal_lahir: warga.tanggal_lahir,
        jenis_kelamin: warga.jenis_kelamin,
        alamat: warga.alamat,
        rt: warga.rt,
        agama: warga.agama,
        status_perkawinan: warga.status_perkawinan,
        pekerjaan: warga.pekerjaan || "",
        pendidikan: warga.pendidikan || "",
        kewarganegaraan: warga.kewarganegaraan || "Indonesia",
      });
    } else {
      form.reset();
    }
  }, [warga, form]);

  const onSubmit = async (values: WargaFormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (isEdit) {
        const { error } = await supabase
          .from("warga")
          .update(values)
          .eq("id", warga.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data warga berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from("warga")
          .insert([{
            ...values,
            created_by: user?.id,
          } as any]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data warga berhasil ditambahkan",
        });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Data Warga" : "Tambah Data Warga"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi data warga" : "Tambahkan data warga baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK *</FormLabel>
                    <FormControl>
                      <Input placeholder="3201234567890123" maxLength={16} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama lengkap" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tempat_lahir"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempat Lahir *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jakarta" {...field} />
                    </FormControl>
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
                      <Input type="date" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis kelamin" />
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
            </div>

            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alamat lengkap" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agama *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih agama" />
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

              <FormField
                control={form.control}
                name="status_perkawinan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Perkawinan *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARITAL_STATUS_OPTIONS.map((option) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pekerjaan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pekerjaan</FormLabel>
                    <FormControl>
                      <Input placeholder="PNS, Wiraswasta, dll" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pendidikan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pendidikan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pendidikan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EDUCATION_OPTIONS.map((option) => (
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

            <FormField
              control={form.control}
              name="kewarganegaraan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kewarganegaraan</FormLabel>
                  <FormControl>
                    <Input placeholder="Indonesia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Perbarui" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
