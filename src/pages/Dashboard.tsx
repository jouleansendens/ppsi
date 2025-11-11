import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UsersRound, Baby, HeartCrack } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWarga: 0,
    totalKeluarga: 0,
    totalKelahiran: 0,
    totalKematian: 0,
  });
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [rtDistribution, setRtDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchAgeDistribution();
    fetchRTDistribution();
  }, []);

  const fetchStats = async () => {
    const [wargaRes, keluargaRes, kelahiranRes, kematianRes] = await Promise.all([
      supabase.from("warga").select("*", { count: "exact", head: true }),
      supabase.from("keluarga").select("*", { count: "exact", head: true }),
      supabase.from("laporan_kelahiran").select("*", { count: "exact", head: true }),
      supabase.from("laporan_kematian").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalWarga: wargaRes.count || 0,
      totalKeluarga: keluargaRes.count || 0,
      totalKelahiran: kelahiranRes.count || 0,
      totalKematian: kematianRes.count || 0,
    });
  };

  const fetchAgeDistribution = async () => {
    const { data } = await supabase.from("warga").select("tanggal_lahir");
    
    if (data) {
      const distribution = {
        "0-5": 0,
        "6-12": 0,
        "18-25": 0,
        "41-60": 0,
        "60+": 0,
      };

      data.forEach((warga) => {
        const age = new Date().getFullYear() - new Date(warga.tanggal_lahir).getFullYear();
        if (age <= 5) distribution["0-5"]++;
        else if (age <= 12) distribution["6-12"]++;
        else if (age <= 25) distribution["18-25"]++;
        else if (age <= 60) distribution["41-60"]++;
        else distribution["60+"]++;
      });

      setAgeDistribution([
        { name: "0-5", jumlah: distribution["0-5"] },
        { name: "6-12", jumlah: distribution["6-12"] },
        { name: "18-25", jumlah: distribution["18-25"] },
        { name: "41-60", jumlah: distribution["41-60"] },
        { name: "60+", jumlah: distribution["60+"] },
      ]);
    }
  };

  const fetchRTDistribution = async () => {
    const { data } = await supabase
      .from("warga")
      .select("rt");

    if (data) {
      const rtCount: Record<string, number> = {};
      data.forEach((warga) => {
        rtCount[warga.rt] = (rtCount[warga.rt] || 0) + 1;
      });

      setRtDistribution(
        Object.entries(rtCount).map(([rt, jumlah]) => ({
          name: `RT ${rt}`,
          jumlah,
        }))
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Ringkasan data warga RW 08</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWarga}</div>
              <p className="text-xs text-muted-foreground">Warga terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keluarga</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <UsersRound className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKeluarga}</div>
              <p className="text-xs text-muted-foreground">Keluarga terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kelahiran</CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Baby className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKelahiran}</div>
              <p className="text-xs text-muted-foreground">Data kelahiran</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kematian</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <HeartCrack className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalKematian}</div>
              <p className="text-xs text-muted-foreground">Data kematian</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Kelompok Usia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jumlah" fill="hsl(var(--primary))" name="Jumlah" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribusi per RT</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rtDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jumlah" fill="hsl(var(--success))" name="Jumlah" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
