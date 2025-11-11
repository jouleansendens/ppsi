import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { RT_OPTIONS, FAMILY_RELATION_OPTIONS } from "@/lib/constants";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
// Import komponen baru untuk Combobox
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";


// --- Skema Validasi ---
const anggotaSchema = z.object({
  warga_id: z.string().min(1, "Warga wajib dipilih"),
  hubungan_keluarga: z.string().min(1, "Hubungan wajib diisi"),
});

const keluargaSchema = z.object({
  nomor_kk: z.string().min(16, "Nomor KK harus 16 digit").max(16, "Nomor KK harus 16 digit"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  rt: z.string().min(1, "RT wajib diisi"),
  anggota: z.array(anggotaSchema)
    .min(1, "Minimal harus ada 1 anggota (Kepala Keluarga)")
    .refine(
      (anggota) => {
        const kkCount = anggota.filter(a => a.hubungan_keluarga === "Kepala Keluarga").length;
        return kkCount === 1;
      },
      {
        message: "Harus ada tepat satu 'Kepala Keluarga' dalam daftar anggota.",
        path: ["root"], 
      }
    ),
});

type KeluargaFormValues = z.infer<typeof keluargaSchema>;
type WargaOption = Pick<Tables<"warga">, "id" | "nama" | "nik">;

// --- Sub-Komponen WargaCombobox (Baru) ---
function WargaCombobox({
  wargaList,
  value,
  onChange,
  disabled = false,
}: {
  wargaList: WargaOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedWarga = wargaList.find((w) => w.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
          >
            {selectedWarga ? `${selectedWarga.nama} (${selectedWarga.nik})` : "Pilih warga"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Cari warga (nama atau NIK)..." />
          <CommandList>
            <CommandEmpty>Warga tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {wargaList.map((warga) => (
                <CommandItem
                  key={warga.id}
                  value={`${warga.nama} ${warga.nik}`}
                  onSelect={() => {
                    onChange(warga.id);
                    setOpen(false);
                  }}
                  className="group"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === warga.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p>{warga.nama}</p>
                    <p className={cn(
                      "text-xs text-muted-foreground",
                      "group-data-[selected=true]:text-accent-foreground group-data-[selected=true]:opacity-80"
                    )}>
                      {warga.nik}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


// --- Komponen Utama Dialog ---
interface KeluargaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keluarga?: Tables<"keluarga">;
  onSuccess: () => void;
}

export function KeluargaFormDialog({ open, onOpenChange, keluarga, onSuccess }: KeluargaFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [wargaList, setWargaList] = useState<WargaOption[]>([]);
  const { toast } = useToast();
  const isEdit = !!keluarga;

  const form = useForm<KeluargaFormValues>({
    resolver: zodResolver(keluargaSchema),
    defaultValues: {
      nomor_kk: "",
      alamat: "",
      rt: "001",
      anggota: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "anggota",
  });

  const watchedAnggota = form.watch("anggota");
  const selectedWargaIds = new Set(watchedAnggota?.map(a => a.warga_id) || []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const { data: wargaData, error: wargaError } = await supabase
        .from("warga")
        .select("id, nama, nik")
        .order("nama");
      
      if (wargaError) {
        toast({ title: "Error", description: "Gagal memuat daftar warga.", variant: "destructive" });
      } else {
        setWargaList(wargaData || []);
      }

      if (isEdit && keluarga) {
        const { data: anggotaData, error: anggotaError } = await supabase
          .from("anggota_keluarga")
          .select("warga_id, hubungan_keluarga")
          .eq("keluarga_id", keluarga.id);
        
        if (anggotaError) {
          toast({ title: "Error", description: "Gagal memuat anggota keluarga.", variant: "destructive" });
        }
        
        form.reset({
          nomor_kk: keluarga.nomor_kk,
          alamat: keluarga.alamat,
          rt: keluarga.rt,
          anggota: anggotaData || [], 
        });
      } else {
        form.reset({
          nomor_kk: "",
          alamat: "",
          rt: "001",
          anggota: [], 
        });
      }
      setLoading(false);
    };

    if (open) {
      loadData();
    }
  }, [isEdit, keluarga, open, form, toast]);


  const onSubmit = async (values: KeluargaFormValues) => {
    setLoading(true);

    const kepalaKeluarga = values.anggota.find(a => a.hubungan_keluarga === "Kepala Keluarga");
    if (!kepalaKeluarga) {
      toast({ title: "Error", description: "Kepala Keluarga tidak ditemukan.", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    const keluargaData = {
      nomor_kk: values.nomor_kk,
      alamat: values.alamat,
      rt: values.rt,
      kepala_keluarga_id: kepalaKeluarga.warga_id,
      jumlah_anggota: values.anggota.length,
    };

    try {
      if (isEdit && keluarga) {
        // --- LOGIKA EDIT ---
        const { error: updateKeluargaError } = await supabase
          .from("keluarga")
          .update(keluargaData)
          .eq("id", keluarga.id);
        
        if (updateKeluargaError) throw updateKeluargaError;

        const anggotaToUpsert = values.anggota.map(a => ({
          keluarga_id: keluarga.id, 
          warga_id: a.warga_id,
          hubungan_keluarga: a.hubungan_keluarga,
        }));
        
        const wargaIdsDiForm = values.anggota.map(a => a.warga_id);
        if (wargaIdsDiForm.length > 0) {
          await supabase
            .from("anggota_keluarga")
            .delete()
            .eq("keluarga_id", keluarga.id)
            .not("warga_id", "in", `(${wargaIdsDiForm.join(",")})`);
        } else {
          await supabase
            .from("anggota_keluarga")
            .delete()
            .eq("keluarga_id", keluarga.id);
        }
        
        await supabase
          .from("anggota_keluarga")
          .upsert(anggotaToUpsert, { onConflict: 'keluarga_id, warga_id' });

        toast({ title: "Berhasil", description: "Data keluarga berhasil diperbarui." });

      } else {
        // --- LOGIKA BUAT BARU ---
        const { data: newKeluarga, error: insertKeluargaError } = await supabase
          .from("keluarga")
          .insert(keluargaData)
          .select("id")
          .single();
        
        if (insertKeluargaError) throw insertKeluargaError;
        if (!newKeluarga) throw new Error("Gagal membuat data keluarga baru.");

        const anggotaToInsert = values.anggota.map(a => ({
          keluarga_id: newKeluarga.id, 
          warga_id: a.warga_id,
          hubungan_keluarga: a.hubungan_keluarga,
        }));

        const { error: insertAnggotaError } = await supabase
          .from("anggota_keluarga")
          .insert(anggotaToInsert);

        if (insertAnggotaError) throw insertAnggotaError;
        
        toast({ title: "Berhasil", description: "Data keluarga baru berhasil dibuat." });
      }

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      if (error.message && error.message.includes("keluarga_nomor_kk_key")) {
        form.setError("nomor_kk", { type: "manual", message: "Nomor KK ini sudah terdaftar. Silakan gunakan nomor lain." });
        toast({
          title: "Error: Nomor KK Duplikat",
          description: "Nomor KK ini sudah terdaftar. Silakan gunakan nomor lain.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Data Keluarga" : "Tambah Data Keluarga"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi data keluarga" : "Tambahkan data keluarga baru ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Bagian Info KK */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomor_kk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor KK *</FormLabel>
                    <FormControl>
                      <Input placeholder="3201234567890123" maxLength={16} {...field} />
                    </FormControl>
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
                    <Textarea placeholder="Masukkan alamat lengkap" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />

            {/* Bagian Form Array Anggota Keluarga */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Anggota Keluarga</h4>
              
              {form.formState.errors.anggota?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.anggota.root.message}
                </p>
              )}

              {fields.map((field, index) => {
                const currentWargaId = watchedAnggota[index]?.warga_id;
                const filteredWargaList = wargaList.filter(
                  w => !selectedWargaIds.has(w.id) || w.id === currentWargaId
                );

                return (
                  <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-secondary/30">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <FormField
                        control={form.control}
                        name={`anggota.${index}.warga_id`}
                        render={({ field }) => (
                          // PERBAIKAN: Hapus className="flex flex-col"
                          <FormItem>
                            <FormLabel>Warga *</FormLabel>
                            <WargaCombobox
                              wargaList={filteredWargaList}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={loading}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`anggota.${index}.hubungan_keluarga`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hubungan *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih hubungan" />
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
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ warga_id: "", hubungan_keluarga: "" })}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Anggota
              </Button>
            </div>


            <DialogFooter className="pt-6">
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