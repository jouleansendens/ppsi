import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type KeluargaDetails = Tables<'keluarga'> & {
  kepala_keluarga: Pick<Tables<'warga'>, 'nama' | 'nik'> | null;
};
type AnggotaKeluargaDetails = Tables<'anggota_keluarga'> & {
  warga: Tables<'warga'> | null;
};

export default function DetailKeluarga() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [keluarga, setKeluarga] = useState<KeluargaDetails | null>(null);
  const [anggota, setAnggota] = useState<AnggotaKeluargaDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchDetailKeluarga = async () => {
      setLoading(true);

      const keluargaPromise = supabase
        .from('keluarga')
        .select(`
          *,
          kepala_keluarga:warga!keluarga_kepala_keluarga_id_fkey(nama, nik)
        `)
        .eq('id', id)
        .single();

      const anggotaPromise = supabase
        .from('anggota_keluarga')
        .select(`
          *,
          warga:warga_id(*)
        `)
        .eq('keluarga_id', id)
        .order('created_at', { ascending: true });

      const [keluargaResult, anggotaResult] = await Promise.all([
        keluargaPromise,
        anggotaPromise,
      ]);

      if (keluargaResult.data) {
        setKeluarga(keluargaResult.data as KeluargaDetails);
      }

      if (anggotaResult.data) {
        setAnggota(anggotaResult.data as AnggotaKeluargaDetails[]);
      }

      setLoading(false);
    };

    fetchDetailKeluarga();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!keluarga) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold">Data Keluarga Tidak Ditemukan</h1>
            <Button variant="outline" onClick={() => navigate('/keluarga')} className="mt-4" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Data Keluarga
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        <Button variant="outline" onClick={() => navigate('/keluarga')} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Kembali ke Data Keluarga</span>
          <span className="sm:hidden">Kembali</span>
        </Button>

        {/* Info Keluarga Card */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Kartu Keluarga No. {keluarga.nomor_kk}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Kepala Keluarga</p>
                <p className="font-medium text-sm md:text-base mt-0.5">{keluarga.kepala_keluarga?.nama || '-'}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">NIK Kepala Keluarga</p>
                <p className="font-medium font-mono text-sm md:text-base mt-0.5">{keluarga.kepala_keluarga?.nik || '-'}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium text-sm md:text-base mt-0.5">{keluarga.alamat}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">RT/RW</p>
                <p className="font-medium text-sm md:text-base mt-0.5">{keluarga.rt}/{keluarga.rw}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anggota Keluarga Card */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6" />
              Daftar Anggota Keluarga
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Hubungan</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Tempat, Tgl Lahir</TableHead>
                    <TableHead>Pekerjaan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada anggota keluarga.
                      </TableCell>
                    </TableRow>
                  ) : (
                    anggota.map((a, index) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{a.warga?.nama}</TableCell>
                        <TableCell className="font-mono text-sm">{a.warga?.nik}</TableCell>
                        <TableCell>
                          <Badge variant={a.hubungan_keluarga === "Kepala Keluarga" ? "default" : "secondary"}>
                            {a.hubungan_keluarga}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.warga?.jenis_kelamin}</TableCell>
                        <TableCell>
                          {a.warga?.tempat_lahir}, {new Date(a.warga?.tanggal_lahir || 0).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>{a.warga?.pekerjaan || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {anggota.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Belum ada anggota keluarga.
                </div>
              ) : (
                anggota.map((a, index) => (
                  <Card key={a.id} className="shadow-sm border-2">
                    <CardContent className="p-3 md:p-4">
                      <div className="space-y-2.5">
                        {/* Header dengan Nomor */}
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base truncate">{a.warga?.nama}</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{a.warga?.nik}</p>
                          </div>
                        </div>

                        {/* Badge Hubungan */}
                        <Badge 
                          variant={a.hubungan_keluarga === "Kepala Keluarga" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {a.hubungan_keluarga}
                        </Badge>

                        {/* Detail Info */}
                        <div className="space-y-1.5 text-xs pt-1">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[100px]">Jenis Kelamin:</span>
                            <span className="flex-1">{a.warga?.jenis_kelamin}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[100px]">Tempat Lahir:</span>
                            <span className="flex-1">{a.warga?.tempat_lahir}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[100px]">Tanggal Lahir:</span>
                            <span className="flex-1">
                              {new Date(a.warga?.tanggal_lahir || 0).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[100px]">Pekerjaan:</span>
                            <span className="flex-1">{a.warga?.pekerjaan || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}