import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  nama_almarhum: z.string().min(1, "Nama almarhum harus diisi"),
  nik: z.string().min(1, "NIK harus diisi").optional(),
  tanggal_meninggal: z.string().min(1, "Tanggal meninggal harus diisi"),
  tempat_meninggal: z.string().min(1, "Tempat meninggal harus diisi"),
  sebab_kematian: z.string().min(1, "Sebab kematian harus diisi").optional(),
  keterangan: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface KematianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kematian: any;
  onSuccess: () => void;
}

export function KematianFormDialog({ open, onOpenChange, kematian, onSuccess }: KematianFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_almarhum: "",
      nik: "",
      tanggal_meninggal: "",
      tempat_meninggal: "",
      sebab_kematian: "",
      keterangan: "",
    },
  });

  useEffect(() => {
    if (kematian) {
      form.reset({
        nama_almarhum: kematian.nama_almarhum || "",
        nik: kematian.nik || "",
        tanggal_meninggal: kematian.tanggal_meninggal || "",
        tempat_meninggal: kematian.tempat_meninggal || "",
        sebab_kematian: kematian.sebab_kematian || "",
        keterangan: kematian.keterangan || "",
      });
    } else {
      form.reset({
        nama_almarhum: "",
        nik: "",
        tanggal_meninggal: "",
        tempat_meninggal: "",
        sebab_kematian: "",
        keterangan: "",
      });
    }
  }, [kematian, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const submitData: any = {
        nama_almarhum: data.nama_almarhum,
        nik: data.nik || null,
        tanggal_meninggal: data.tanggal_meninggal,
        tempat_meninggal: data.tempat_meninggal,
        sebab_kematian: data.sebab_kematian || null,
        keterangan: data.keterangan || null,
      };

      if (kematian) {
        const { error } = await supabase
          .from("laporan_kematian")
          .update(submitData)
          .eq("id", kematian.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data kematian berhasil diperbarui" });
      } else {
        const { error } = await supabase.from("laporan_kematian").insert([submitData]);
        if (error) throw error;
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_almarhum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Almarhum *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIK</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={16} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
