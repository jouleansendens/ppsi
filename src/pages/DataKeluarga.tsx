import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, Download, Filter, ChevronDown, ChevronUp, Loader2, Eye, Users2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportKeluargaToExcel, exportSingleKeluargaToExcel } from "@/lib/exportUtils";
import { RT_OPTIONS } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { KeluargaFormDialog } from "@/components/keluarga/KeluargaFormDialog";
import { Card, CardContent } from "@/components/ui/card";
import { AnggotaKeluargaFormDialog } from "@/components/keluarga/AnggotaKeluargaFormDialog";
import type { Tables } from "@/integrations/supabase/types";
import { Separator } from "@/components/ui/separator";

type AnggotaKeluargaWithWarga = Tables<"anggota_keluarga"> & {
  warga: Tables<"warga"> | null;
};

type KeluargaWithKepala = Tables<"keluarga"> & {
  kepala_keluarga: Pick<Tables<"warga">, "nama" | "nik"> | null;
};

// Komponen AnggotaKeluargaTable - Responsive
function AnggotaKeluargaTable({ 
  keluargaId, 
  refreshKey,
  onAddAnggotaClick,
  onRefreshData
}: { 
  keluargaId: string, 
  refreshKey: number,
  onAddAnggotaClick: () => void,
  onRefreshData: () => void
}) {
  const [anggota, setAnggota] = useState<AnggotaKeluargaWithWarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteAnggotaDialog, setDeleteAnggotaDialog] = useState(false);
  const [anggotaToDelete, setAnggotaToDelete] = useState<AnggotaKeluargaWithWarga | null>(null);
  const { toast } = useToast();

  const fetchAnggota = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anggota_keluarga")
        .select(`
          *,
          warga:warga_id(*)
        `)
        .eq("keluarga_id", keluargaId)
        .order("hubungan_keluarga", { ascending: true });

      if (error) throw error;
      if (data) {
        setAnggota(data as AnggotaKeluargaWithWarga[]);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat anggota";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [keluargaId, toast]);

  useEffect(() => {
    fetchAnggota();
  }, [fetchAnggota, refreshKey]);

  const handleDeleteAnggota = (anggota: AnggotaKeluargaWithWarga) => {
    setAnggotaToDelete(anggota);
    setDeleteAnggotaDialog(true);
  };

  const confirmDeleteAnggota = useCallback(async () => {
    if (!anggotaToDelete) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("anggota_keluarga")
        .delete()
        .eq("id", anggotaToDelete.id);

      if (deleteError) throw deleteError;

      const { data: keluargaData, error: fetchError } = await supabase
        .from("keluarga")
        .select("jumlah_anggota")
        .eq("id", keluargaId)
        .single();
      
      if (fetchError) throw fetchError;

      const newCount = Math.max(0, (keluargaData?.jumlah_anggota || 1) - 1);

      const { error: updateError } = await supabase
        .from("keluarga")
        .update({ jumlah_anggota: newCount })
        .eq("id", keluargaId);

      if (updateError) throw updateError;

      toast({
        title: "Berhasil",
        description: `Warga ${anggotaToDelete.warga?.nama || ''} berhasil dihapus dari keluarga.`,
      });

      fetchAnggota(); 
      onRefreshData(); 

    } catch (error: unknown) {
       const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
      setDeleteAnggotaDialog(false);
      setAnggotaToDelete(null);
    }
  }, [anggotaToDelete, keluargaId, toast, fetchAnggota, onRefreshData]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Memuat anggota keluarga...</div>;
  }

  return (
    <div className="p-3 md:p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
          <Users className="h-4 w-4" />
          Anggota Keluarga ({anggota.length})
        </h4>
        <Button size="sm" onClick={onAddAnggotaClick}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {anggota.length === 0 ? (
         <div className="py-4 text-center text-muted-foreground text-sm">Belum ada anggota keluarga</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Hubungan</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Tanggal Lahir</TableHead>
                  <TableHead>Pekerjaan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggota.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.warga?.nama || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{a.warga?.nik || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={a.hubungan_keluarga === 'Kepala Keluarga' ? 'default' : 'secondary'}>
                        {a.hubungan_keluarga}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.warga?.jenis_kelamin || "-"}</TableCell>
                    <TableCell>{a.warga?.tanggal_lahir ? new Date(a.warga.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell>{a.warga?.pekerjaan || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => handleDeleteAnggota(a)}
                        disabled={a.hubungan_keluarga === 'Kepala Keluarga'}
                        title={a.hubungan_keluarga === 'Kepala Keluarga' ? 'Ubah Kepala Keluarga melalui Edit Keluarga' : 'Hapus Anggota'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {anggota.map((a) => (
              <Card key={a.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm truncate">{a.warga?.nama || "-"}</h5>
                        <p className="text-xs text-muted-foreground font-mono">{a.warga?.nik || "-"}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0"
                        onClick={() => handleDeleteAnggota(a)}
                        disabled={a.hubungan_keluarga === 'Kepala Keluarga'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Badge */}
                    <Badge variant={a.hubungan_keluarga === 'Kepala Keluarga' ? 'default' : 'secondary'} className="text-xs">
                      {a.hubungan_keluarga}
                    </Badge>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs pt-1">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[90px]">Jenis Kelamin:</span>
                        <span className="flex-1">{a.warga?.jenis_kelamin || "-"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[90px]">Tanggal Lahir:</span>
                        <span className="flex-1">
                          {a.warga?.tanggal_lahir ? new Date(a.warga.tanggal_lahir).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[90px]">Pekerjaan:</span>
                        <span className="flex-1">{a.warga?.pekerjaan || "-"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={deleteAnggotaDialog} onOpenChange={setDeleteAnggotaDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota Keluarga</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{anggotaToDelete?.warga?.nama}</strong> dari
              keluarga ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnggota} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Komponen Utama DataKeluarga
export default function DataKeluarga() {
  const [keluarga, setKeluarga] = useState<KeluargaWithKepala[]>([]);
  const [filteredKeluarga, setFilteredKeluarga] = useState<KeluargaWithKepala[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] = useState<KeluargaWithKepala | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keluargaToDelete, setKeluargaToDelete] = useState<KeluargaWithKepala | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRT, setFilterRT] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate(); 

  const [anggotaDialogOpen, setAnggotaDialogOpen] = useState(false);
  const [selectedKeluargaId, setSelectedKeluargaId] = useState<string | null>(null);
  const [anggotaRefreshKey, setAnggotaRefreshKey] = useState(0);

  const fetchKeluarga = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("keluarga")
      .select(`
        *,
        kepala_keluarga:warga!keluarga_kepala_keluarga_id_fkey(nama, nik)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data keluarga",
        variant: "destructive",
      });
    } else {
      setKeluarga((data as KeluargaWithKepala[]) || []);
      setFilteredKeluarga((data as KeluargaWithKepala[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchKeluarga();
  }, [fetchKeluarga]);

  const fetchAnggotaKeluarga = async (keluargaId: string) => {
    const { data, error } = await supabase
      .from("anggota_keluarga")
      .select(`
        *,
        warga:warga_id(*)
      `)
      .eq("keluarga_id", keluargaId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data anggota keluarga",
        variant: "destructive",
      });
      return [];
    }
    return (data as AnggotaKeluargaWithWarga[]) || [];
  };

  useEffect(() => {
    let filtered = keluarga;

    if (searchQuery) {
      filtered = filtered.filter(
        (k) =>
          k.nomor_kk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          k.kepala_keluarga?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          k.alamat?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRT !== "all") {
      filtered = filtered.filter((k) => k.rt === filterRT);
    }

    setFilteredKeluarga(filtered);
  }, [searchQuery, filterRT, keluarga]);

  const handleAddKeluarga = () => {
    setSelectedKeluarga(null);
    setDialogOpen(true);
  };

  const handleEditKeluarga = (k: KeluargaWithKepala) => {
    setSelectedKeluarga(k);
    setDialogOpen(true);
  };

  const handleDeleteKeluarga = (k: KeluargaWithKepala) => {
    setKeluargaToDelete(k);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!keluargaToDelete) return;
    
    try {
      setLoading(true);
      await supabase
        .from("anggota_keluarga")
        .delete()
        .eq("keluarga_id", keluargaToDelete.id);

      const { error } = await supabase
        .from("keluarga")
        .delete()
        .eq("id", keluargaToDelete.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data keluarga berhasil dihapus",
      });

      fetchKeluarga();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setKeluargaToDelete(null);
      setLoading(false);
    }
  };

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleOpenAddAnggotaDialog = (keluargaId: string) => {
    setSelectedKeluargaId(keluargaId);
    setAnggotaDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchKeluarga();
    if(expandedRows.size > 0) {
      setAnggotaRefreshKey(k => k + 1);
    }
  }

  const handleExportAll = async () => {
    try {
      const exportData = await Promise.all(
        filteredKeluarga.map(async (k) => {
          const anggota = await fetchAnggotaKeluarga(k.id);
          return {
            nomor_kk: k.nomor_kk,
            kepala_keluarga: k.kepala_keluarga?.nama || "-",
            rt: k.rt,
            rw: k.rw,
            alamat: k.alamat,
            anggota: anggota.map((a: AnggotaKeluargaWithWarga) => ({
              nama: a.warga?.nama || "-",
              nik: a.warga?.nik || "-",
              jenis_kelamin: a.warga?.jenis_kelamin || "-",
              tanggal_lahir: a.warga?.tanggal_lahir || "-",
              hubungan_keluarga: a.hubungan_keluarga || "-",
              pekerjaan: a.warga?.pekerjaan || "-",
              pendidikan: a.warga?.pendidikan || "-",
            })),
          };
        })
      );

      const filename = filterRT !== "all" ? `Data_Keluarga_RT_${filterRT}` : "Data_Keluarga_RW_08";
      exportKeluargaToExcel(exportData, filename);

      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke Excel",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };

  const handleExportSingle = async (keluargaData: KeluargaWithKepala) => {
    try {
      const anggota = await fetchAnggotaKeluarga(keluargaData.id);
      const exportData = {
        nomor_kk: keluargaData.nomor_kk,
        kepala_keluarga: keluargaData.kepala_keluarga?.nama || "-",
        rt: keluargaData.rt,
        rw: keluargaData.rw,
        alamat: keluargaData.alamat,
        anggota: anggota.map((a: AnggotaKeluargaWithWarga) => ({
          nama: a.warga?.nama || "-",
          nik: a.warga?.nik || "-",
          jenis_kelamin: a.warga?.jenis_kelamin || "-",
          tanggal_lahir: a.warga?.tanggal_lahir || "-",
          hubungan_keluarga: a.hubungan_keluarga || "-",
          pekerjaan: a.warga?.pekerjaan || "-",
          pendidikan: a.warga?.pendidikan || "-",
        })),
      };

      exportSingleKeluargaToExcel(exportData);

      toast({
        title: "Berhasil",
        description: "Data keluarga berhasil diekspor",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Gagal mengekspor data",
        variant: "destructive",
      });
    }
  };
  
  const hasActiveFilters = searchQuery || filterRT !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Data Keluarga</h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Users2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>
                Total: <span className="font-semibold text-foreground">{filteredKeluarga.length}</span> keluarga
                {filterRT !== "all" && <span className="text-primary"> • RT {filterRT}</span>}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportAll}
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={filteredKeluarga.length === 0}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={handleAddKeluarga} size="sm" className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tambah Keluarga</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </div>

        {/* Filter */}
        <Card className="border-2">
          <CardContent className="pt-4 md:pt-6 pb-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari No. KK, Nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="w-full sm:w-[160px]">
                <Select value={filterRT} onValueChange={setFilterRT}>
                  <SelectTrigger className="h-9 text-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter RT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua RT</SelectItem>
                    {RT_OPTIONS.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        RT {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Filter:</span>
                <div className="flex flex-wrap gap-1.5">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {searchQuery}
                      <button onClick={() => setSearchQuery("")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterRT !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      RT {filterRT}
                      <button onClick={() => setFilterRT("all")}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <div className="grid gap-3 md:gap-4">
          {/* Loading */}
          {loading && filteredKeluarga.length === 0 && (
            <Card>
              <CardContent className="py-8 md:py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                  <p className="text-xs md:text-sm text-muted-foreground">Memuat data...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty */}
          {!loading && filteredKeluarga.length === 0 && (
            <Card>
              <CardContent className="py-8 md:py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex items-center justify-center">
                    <Users2 className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm md:text-base">Tidak ada data</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? "Tidak ada data yang sesuai" : "Belum ada data keluarga"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop Table */}
          {filteredKeluarga.length > 0 && (
            <div className="hidden lg:block border rounded-lg bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[140px] font-semibold">No. KK</TableHead>
                      <TableHead className="font-semibold">Kepala Keluarga</TableHead>
                      <TableHead className="font-semibold">NIK Kepala</TableHead>
                      <TableHead className="text-center font-semibold">Anggota</TableHead>
                      <TableHead className="text-center font-semibold">RT/RW</TableHead>
                      <TableHead className="font-semibold">Alamat</TableHead>
                      <TableHead className="text-right font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeluarga.map((k) => (
                      <>
                        <TableRow key={k.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandRow(k.id)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedRows.has(k.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{k.nomor_kk}</TableCell>
                          <TableCell className="font-medium">{k.kepala_keluarga?.nama || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">{k.kepala_keluarga?.nik || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="gap-1">
                              <Users className="h-3 w-3" />
                              {k.jumlah_anggota}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{k.rt}/{k.rw}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm">{k.alamat}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/keluarga/${k.id}`)}
                                title="Lihat Detail"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportSingle(k)}
                                title="Export"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditKeluarga(k)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKeluarga(k)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(k.id) && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30 p-0">
                              <AnggotaKeluargaTable 
                                keluargaId={k.id} 
                                refreshKey={anggotaRefreshKey}
                                onAddAnggotaClick={() => handleOpenAddAnggotaDialog(k.id)}
                                onRefreshData={fetchKeluarga}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Mobile/Tablet Card View */}
          {filteredKeluarga.length > 0 && (
            <div className="lg:hidden space-y-3">
              {filteredKeluarga.map((k) => (
                <Card key={k.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground font-mono">{k.nomor_kk}</p>
                          <h3 className="font-semibold text-sm md:text-base truncate mt-0.5">{k.kepala_keluarga?.nama || "-"}</h3>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/keluarga/${k.id}`)}
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditKeluarga(k)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteKeluarga(k)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          RT {k.rt}/RW {k.rw}
                        </Badge>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Users className="h-3 w-3" />
                          {k.jumlah_anggota} Anggota
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5 text-xs pt-1">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[70px]">NIK Kepala:</span>
                          <span className="flex-1 font-mono">{k.kepala_keluarga?.nik || "-"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[70px]">Alamat:</span>
                          <span className="flex-1">{k.alamat}</span>
                        </div>
                      </div>

                      {/* Expand Button */}
                      <Separator />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-between h-8 text-xs" 
                        onClick={() => toggleExpandRow(k.id)}
                      >
                        <span>Lihat Anggota Keluarga</span>
                        {expandedRows.has(k.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>

                      {/* Expanded Content */}
                      {expandedRows.has(k.id) && (
                        <div className="bg-muted/30 rounded-lg -mx-3 -mb-3 md:-mx-4 md:-mb-4">
                          <AnggotaKeluargaTable 
                            keluargaId={k.id} 
                            refreshKey={anggotaRefreshKey}
                            onAddAnggotaClick={() => handleOpenAddAnggotaDialog(k.id)}
                            onRefreshData={fetchKeluarga}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <KeluargaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        keluarga={selectedKeluarga}
        onSuccess={handleSuccess}
      />

      <AnggotaKeluargaFormDialog
        open={anggotaDialogOpen}
        onOpenChange={setAnggotaDialogOpen}
        keluargaId={selectedKeluargaId}
        onSuccess={() => {
          setAnggotaDialogOpen(false);
          handleSuccess();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Hapus Data Keluarga</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus data keluarga dengan No. KK{" "}
              <strong>{keluargaToDelete?.nomor_kk}</strong>? 
              Tindakan ini juga akan menghapus semua data anggota terkait dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}