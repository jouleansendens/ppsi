import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileDown, Filter, Search, Users2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportWargaToExcel } from "@/lib/exportUtils";
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
import { WargaFormDialog } from "@/components/warga/WargaFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DataWarga() {
  const [warga, setWarga] = useState<any[]>([]);
  const [filteredWarga, setFilteredWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRT, setFilterRT] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wargaToDelete, setWargaToDelete] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWarga();
  }, []);

  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("warga")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data warga",
        variant: "destructive",
      });
    } else {
      setWarga(data || []);
      setFilteredWarga(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let filtered = warga;

    if (searchQuery) {
      filtered = filtered.filter(
        (w) =>
          w.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.nik?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.alamat?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRT !== "all") {
      filtered = filtered.filter((w) => w.rt === filterRT);
    }

    setFilteredWarga(filtered);
  }, [searchQuery, filterRT, warga]);

  const handleAddWarga = () => {
    setSelectedWarga(null);
    setDialogOpen(true);
  };

  const handleEditWarga = (w: any) => {
    setSelectedWarga(w);
    setDialogOpen(true);
  };

  const handleDeleteWarga = (w: any) => {
    setWargaToDelete(w);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!wargaToDelete) return;

    try {
      const { error } = await supabase.from("warga").delete().eq("id", wargaToDelete.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data warga berhasil dihapus",
      });

      fetchWarga();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWargaToDelete(null);
    }
  };

  const handleExport = () => {
    const exportData = filteredWarga.map((w, index) => {
      const birthDate = new Date(w.tanggal_lahir);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      return {
        no: index + 1,
        nik: w.nik,
        nama: w.nama,
        jenis_kelamin: w.jenis_kelamin === "Laki-laki" ? "Laki-laki" : "Perempuan",
        tanggal_lahir: birthDate.toLocaleDateString("id-ID"),
        umur: age,
        alamat: w.alamat,
        rt: w.rt,
        agama: w.agama,
        status_perkawinan: w.status_perkawinan,
        pekerjaan: w.pekerjaan || "-",
        pendidikan: w.pendidikan || "-",
      };
    });

    const filename = filterRT !== "all" ? `Data_Warga_RT_${filterRT}` : "Data_Warga_RW_08";
    exportWargaToExcel(exportData, filename);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke Excel",
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const hasActiveFilters = searchQuery || filterRT !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Data Warga</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2 className="h-4 w-4" />
              <span>
                Total: <span className="font-semibold text-foreground">{filteredWarga.length}</span> warga
                {filterRT !== "all" && <span className="text-primary"> • RT {filterRT}</span>}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="flex-1 sm:flex-none"
              disabled={filteredWarga.length === 0}
            >
              <FileDown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={handleAddWarga} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tambah Warga</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIK, atau alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
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
              
              <div className="w-full sm:w-[200px]">
                <Select value={filterRT} onValueChange={setFilterRT}>
                  <SelectTrigger>
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
                <span className="text-xs text-muted-foreground">Filter aktif:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Pencarian: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterRT !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      RT {filterRT}
                      <button onClick={() => setFilterRT("all")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Desktop Table View */}
        <div className="hidden lg:block border rounded-lg bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] font-semibold">NIK</TableHead>
                <TableHead className="font-semibold">Nama</TableHead>
                <TableHead className="font-semibold">TTL</TableHead>
                <TableHead className="text-center font-semibold">Umur</TableHead>
                <TableHead className="text-center font-semibold">JK</TableHead>
                <TableHead className="text-center font-semibold">RT/RW</TableHead>
                <TableHead className="font-semibold">Alamat</TableHead>
                <TableHead className="font-semibold">Pekerjaan</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p className="text-sm text-muted-foreground">Memuat data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredWarga.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Tidak ada data</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasActiveFilters ? "Tidak ada data yang sesuai dengan pencarian" : "Belum ada data warga"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarga.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">{w.nik}</TableCell>
                    <TableCell className="font-medium">{w.nama}</TableCell>
                    <TableCell className="text-sm">
                      {w.tempat_lahir}, {new Date(w.tanggal_lahir).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-medium">
                        {calculateAge(w.tanggal_lahir)} th
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={w.jenis_kelamin === "Laki-laki" ? "default" : "outline"}>
                        {w.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{w.rt}/{w.rw}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{w.alamat}</TableCell>
                    <TableCell className="text-sm">{w.pekerjaan || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditWarga(w)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWarga(w)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Memuat data...</p>
              </div>
            </Card>
          ) : filteredWarga.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Users2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Tidak ada data</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters ? "Tidak ada data yang sesuai" : "Belum ada data warga"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            filteredWarga.map((w) => (
              <Card key={w.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{w.nama}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{w.nik}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWarga(w)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWarga(w)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={w.jenis_kelamin === "Laki-laki" ? "default" : "outline"} className="text-xs">
                        {w.jenis_kelamin === "Laki-laki" ? "Laki-laki" : "Perempuan"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {calculateAge(w.tanggal_lahir)} tahun
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        RT {w.rt}/RW {w.rw}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[80px]">TTL:</span>
                        <span className="flex-1">
                          {w.tempat_lahir}, {new Date(w.tanggal_lahir).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[80px]">Alamat:</span>
                        <span className="flex-1">{w.alamat}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[80px]">Pekerjaan:</span>
                        <span className="flex-1">{w.pekerjaan || "-"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <WargaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warga={selectedWarga}
        onSuccess={fetchWarga}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Warga</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data warga <strong>{wargaToDelete?.nama}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}