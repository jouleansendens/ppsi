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
import { Button } from "@/components/ui/button";
import { FAMILY_RELATION_OPTIONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const anggotaKeluargaSchema = z.object({
  warga_id: z.string().min(1, "Warga wajib dipilih"),
  hubungan_keluarga: z.string().min(1, "Hubungan keluarga wajib diisi"),
});

type AnggotaKeluargaFormValues = z.infer<typeof anggotaKeluargaSchema>;

type WargaOption = Pick<Tables<"warga">, "id" | "nama" | "nik">;

interface AnggotaKeluargaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keluargaId: string | null;
  onSuccess: () => void;
}

export function AnggotaKeluargaFormDialog({
  open,
  onOpenChange,
  keluargaId,
  onSuccess,
}: AnggotaKeluargaFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [availableWarga, setAvailableWarga] = useState<WargaOption[]>([]);
  const { toast } = useToast();

  const form = useForm<AnggotaKeluargaFormValues>({
    resolver: zodResolver(anggotaKeluargaSchema),
    defaultValues: {
      warga_id: "",
      hubungan_keluarga: "",
    },
  });

  useEffect(() => {
    const fetchAvailableWarga = async (currentKeluargaId: string) => {
      setLoading(true);
      try {
        // 1. Ambil semua warga
        const { data: allWarga, error: wargaError } = await supabase
          .from("warga")
          .select("id, nama, nik");

        if (wargaError) throw wargaError;

        // 2. Ambil anggota yang sudah ada di KK ini
        const { data: currentAnggota, error: anggotaError } = await supabase
          .from("anggota_keluarga")
          .select("warga_id")
          .eq("keluarga_id", currentKeluargaId);

        if (anggotaError) throw anggotaError;

        const currentAnggotaIds = new Set(currentAnggota.map(a => a.warga_id));

        // 3. Filter warga yang belum ada di KK ini
        const filteredWarga = allWarga.filter(w => !currentAnggotaIds.has(w.id));
        setAvailableWarga(filteredWarga);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Gagal memuat daftar warga";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (open && keluargaId) {
      fetchAvailableWarga(keluargaId);
    } else {
      // Reset list and form when dialog is closed
      setAvailableWarga([]);
      form.reset();
    }
  }, [open, keluargaId, toast, form]);


  const onSubmit = async (values: AnggotaKeluargaFormValues) => {
    if (!keluargaId) return;

    setLoading(true);
    try {
      // 1. Tambah anggota ke tabel anggota_keluarga
      const { error: insertError } = await supabase
        .from("anggota_keluarga")
        .insert([
          {
            keluarga_id: keluargaId,
            warga_id: values.warga_id,
            hubungan_keluarga: values.hubungan_keluarga,
          },
        ]);

      if (insertError) throw insertError;

      // 2. Update jumlah_anggota di tabel keluarga
      const { data: keluargaData, error: fetchError } = await supabase
        .from("keluarga")
        .select("jumlah_anggota")
        .eq("id", keluargaId)
        .single();

      if (fetchError) throw fetchError;

      const newCount = (keluargaData?.jumlah_anggota || 0) + 1;

      const { error: updateError } = await supabase
        .from("keluarga")
        .update({ jumlah_anggota: newCount })
        .eq("id", keluargaId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: "Anggota keluarga berhasil ditambahkan",
      });

      form.reset();
      onSuccess(); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Anggota Keluarga</DialogTitle>
          <DialogDescription>
            Pilih warga dan tentukan hubungannya dalam keluarga ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="warga_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warga *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loading}>
                        <SelectValue placeholder="Pilih warga untuk ditambahkan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>Memuat...</SelectItem>
                      ) : (
                        availableWarga.map((warga) => (
                          <SelectItem key={warga.id} value={warga.id}>
                            {warga.nama} ({warga.nik})
                          </SelectItem>
                        ))
                      )}
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
                  <FormLabel>Hubungan Keluarga *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hubungan keluarga" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FAMILY_RELATION_OPTIONS.map((option) => (
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
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}