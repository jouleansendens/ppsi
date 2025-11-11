import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Baby, HeartCrack } from "lucide-react";
import { KelahiranFormDialog } from "@/components/laporan/KelahiranFormDialog";
import { KematianFormDialog } from "@/components/laporan/KematianFormDialog";
import { KelahiranDetailDialog } from "@/components/laporan/KelahiranDetailDialog";
import { KematianDetailDialog } from "@/components/laporan/KematianDetailDialog";

export default function Laporan() {
  const [kelahiran, setKelahiran] = useState<any[]>([]);
  const [kematian, setKematian] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kelahiranDialogOpen, setKelahiranDialogOpen] = useState(false);
  const [kematianDialogOpen, setKematianDialogOpen] = useState(false);
  const [kelahiranDetailOpen, setKelahiranDetailOpen] = useState(false);
  const [kematianDetailOpen, setKematianDetailOpen] = useState(false);
  const [selectedKelahiran, setSelectedKelahiran] = useState<any>(null);
  const [selectedKematian, setSelectedKematian] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'kelahiran' | 'kematian'; item: any } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [kelahiranRes, kematianRes] = await Promise.all([
      supabase.from("laporan_kelahiran").select("*").order("created_at", { ascending: false }),
      supabase.from("laporan_kematian").select("*").order("created_at", { ascending: false }),
    ]);

    if (kelahiranRes.error || kematianRes.error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data laporan",
        variant: "destructive",
      });
    } else {
      setKelahiran(kelahiranRes.data || []);
      setKematian(kematianRes.data || []);
    }
    setLoading(false);
  };

  const handleAddKelahiran = () => {
    setSelectedKelahiran(null);
    setKelahiranDialogOpen(true);
  };

  const handleEditKelahiran = (item: any) => {
    setSelectedKelahiran(item);
    setKelahiranDialogOpen(true);
  };

  const handleViewKelahiran = (item: any) => {
    setSelectedKelahiran(item);
    setKelahiranDetailOpen(true);
  };

  const handleAddKematian = () => {
    setSelectedKematian(null);
    setKematianDialogOpen(true);
  };

  const handleEditKematian = (item: any) => {
    setSelectedKematian(item);
    setKematianDialogOpen(true);
  };

  const handleViewKematian = (item: any) => {
    setSelectedKematian(item);
    setKematianDetailOpen(true);
  };

  const handleDelete = (type: 'kelahiran' | 'kematian', item: any) => {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const table = itemToDelete.type === 'kelahiran' ? 'laporan_kelahiran' : 'laporan_kematian';
      const { error } = await supabase.from(table).delete().eq("id", itemToDelete.item.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Data ${itemToDelete.type} berhasil dihapus`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Data kelahiran dan kematian warga RW 08</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kelahiran</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Baby className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{kelahiran.length}</div>
              <p className="text-xs text-muted-foreground">Data kelahiran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kematian</CardTitle>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <HeartCrack className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{kematian.length}</div>
              <p className="text-xs text-muted-foreground">Data kematian</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kelahiran" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="kelahiran" className="text-sm sm:text-base flex items-center justify-center">Kelahiran</TabsTrigger>
            <TabsTrigger value="kematian" className="text-sm sm:text-base flex items-center justify-center">Kematian</TabsTrigger>
          </TabsList>

          <TabsContent value="kelahiran" className="space-y-3 sm:space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleAddKelahiran} className="text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah Kelahiran</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </div>

            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bayi</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Tanggal Lapor</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : kelahiran.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    kelahiran.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.nama_bayi}</TableCell>
                        <TableCell>{k.nik_bayi || "-"}</TableCell>
                        <TableCell>{new Date(k.tanggal_lahir).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>{k.keterangan || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewKelahiran(k)} title="Lihat Detail">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditKelahiran(k)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete('kelahiran', k)} className="text-destructive hover:text-destructive" title="Hapus">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : kelahiran.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data
                </div>
              ) : (
                kelahiran.map((k) => (
                  <Card key={k.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-muted-foreground">Nama Bayi</p>
                            <p className="font-semibold">{k.nama_bayi}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewKelahiran(k)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditKelahiran(k)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete('kelahiran', k)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">NIK</p>
                          <p className="text-sm">{k.nik_bayi || "-"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Tanggal Lahir</p>
                          <p className="text-sm">{new Date(k.tanggal_lahir).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Keterangan</p>
                          <p className="text-sm">{k.keterangan || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="kematian" className="space-y-3 sm:space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleAddKematian} className="text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah Kematian</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </div>

            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Almarhum</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Tanggal Lapor</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : kematian.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    kematian.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.nama_almarhum}</TableCell>
                        <TableCell>{k.nik || "-"}</TableCell>
                        <TableCell>{new Date(k.tanggal_meninggal).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>{k.keterangan || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewKematian(k)} title="Lihat Detail">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditKematian(k)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete('kematian', k)} className="text-destructive hover:text-destructive" title="Hapus">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : kematian.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data
                </div>
              ) : (
                kematian.map((k) => (
                  <Card key={k.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-muted-foreground">Nama Almarhum</p>
                            <p className="font-semibold">{k.nama_almarhum}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewKematian(k)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditKematian(k)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete('kematian', k)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">NIK</p>
                          <p className="text-sm">{k.nik || "-"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Tanggal Meninggal</p>
                          <p className="text-sm">{new Date(k.tanggal_meninggal).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Keterangan</p>
                          <p className="text-sm">{k.keterangan || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <KelahiranFormDialog
        open={kelahiranDialogOpen}
        onOpenChange={setKelahiranDialogOpen}
        kelahiran={selectedKelahiran}
        onSuccess={fetchData}
      />

      <KematianFormDialog
        open={kematianDialogOpen}
        onOpenChange={setKematianDialogOpen}
        kematian={selectedKematian}
        onSuccess={fetchData}
      />

      <KelahiranDetailDialog
        open={kelahiranDetailOpen}
        onOpenChange={setKelahiranDetailOpen}
        kelahiran={selectedKelahiran}
      />

      <KematianDetailDialog
        open={kematianDetailOpen}
        onOpenChange={setKematianDetailOpen}
        kematian={selectedKematian}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}