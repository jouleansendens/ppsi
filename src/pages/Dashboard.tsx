import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, UsersRound, Baby, HeartCrack, TrendingUp, TrendingDown, Home, 
  UserCheck, LayoutDashboard, FileText, UserPlus, LogOut 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout"; // <- Diganti menggunakan layout Anda
import { supabase } from "@/integrations/supabase/client"; // <- Ditambahkan untuk fetch data

export default function Dashboard() {
  // State dari file target (File 1), dengan nilai awal
  const [stats, setStats] = useState({
    totalWarga: 245,
    totalKeluarga: 78,
    totalKelahiran: 12,
    totalKematian: 5,
    lakilaki: 128,
    perempuan: 117,
    kawin: 156,
    belumKawin: 89,
  });

  // State untuk chart, diawali array kosong karena akan di-fetch
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [rtDistribution, setRtDistribution] = useState<any[]>([]);

  // State ini tidak ada di logic fetch Anda, jadi kita tetap gunakan data statis
  const [monthlyTrend, setMonthlyTrend] = useState([
    { bulan: "Jul", kelahiran: 2, kematian: 1 },
    { bulan: "Agu", kelahiran: 1, kematian: 0 },
    { bulan: "Sep", kelahiran: 3, kematian: 1 },
    { bulan: "Okt", kelahiran: 4, kematian: 2 },
    { bulan: "Nov", kelahiran: 2, kematian: 1 },
  ]);

  const [religionData, setReligionData] = useState([
    { name: "Islam", value: 198, persen: 80.8 },
    { name: "Kristen", value: 28, persen: 11.4 },
    { name: "Katolik", value: 15, persen: 6.1 },
    { name: "Hindu", value: 3, persen: 1.2 },
    { name: "Buddha", value: 1, persen: 0.4 },
  ]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Helper Tooltip dari File 1
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payload[0].value} warga ({payload[0].payload.persen}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Logic Fetch dari File 2 (Dashboard_awal.jsx)
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

    // Update state, tapi tetap pertahankan data statis lainnya (laki2, perempuan, dll)
    setStats(prevStats => ({
      ...prevStats,
      totalWarga: wargaRes.count || prevStats.totalWarga,
      totalKeluarga: keluargaRes.count || prevStats.totalKeluarga,
      totalKelahiran: kelahiranRes.count || prevStats.totalKelahiran,
      totalKematian: kematianRes.count || prevStats.totalKematian,
    }));
  };

  // Diadaptasi agar sesuai dengan grup usia di File 1
  const fetchAgeDistribution = async () => {
    const { data } = await supabase.from("warga").select("tanggal_lahir");
    
    if (data) {
      const distribution = {
        "0-5 tahun": 0,
        "6-12 tahun": 0,
        "13-17 tahun": 0,
        "18-25 tahun": 0,
        "26-40 tahun": 0,
        "41-60 tahun": 0,
        "60+ tahun": 0,
      };

      let validDataCount = 0;
      data.forEach((warga) => {
        if (!warga.tanggal_lahir) return; // Skip jika tanggal lahir null
        validDataCount++;
        const age = new Date().getFullYear() - new Date(warga.tanggal_lahir).getFullYear();
        if (age <= 5) distribution["0-5 tahun"]++;
        else if (age <= 12) distribution["6-12 tahun"]++;
        else if (age <= 17) distribution["13-17 tahun"]++;
        else if (age <= 25) distribution["18-25 tahun"]++;
        else if (age <= 40) distribution["26-40 tahun"]++;
        else if (age <= 60) distribution["41-60 tahun"]++;
        else distribution["60+ tahun"]++;
      });

      // Format data + hitung persen
      const formattedDistribution = Object.entries(distribution).map(([name, jumlah]) => ({
        name,
        jumlah,
        persen: validDataCount > 0 ? parseFloat(((jumlah / validDataCount) * 100).toFixed(1)) : 0,
      }));
      setAgeDistribution(formattedDistribution);
    }
  };

  // Diadaptasi agar sesuai dengan state di File 1 (menambahkan key 'keluarga')
  const fetchRTDistribution = async () => {
    const { data } = await supabase
      .from("warga")
      .select("rt");

    if (data) {
      const rtCount: Record<string, number> = {};
      data.forEach((warga) => {
        if (!warga.rt) return; // Skip jika RT null
        rtCount[warga.rt] = (rtCount[warga.rt] || 0) + 1;
      });

      setRtDistribution(
        Object.entries(rtCount).map(([rt, jumlah]) => ({
          name: `RT ${rt}`,
          jumlah,
          keluarga: 0, // Logic untuk fetch keluarga per RT tidak ada di File 2
                       // jadi kita set 0 agar chart tidak error
        }))
      );
    }
  };

  // Mulai render JSX
  return (
    <DashboardLayout>
      {/* Sidebar, Tombol Mobile, dan Overlay dihapus dari sini 
        karena sudah ditangani oleh DashboardLayout 
      */}

      {/* Main Content - (lg:ml-64 dihapus) */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-2xl p-8 shadow-xl">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard RW 08</h1>
            <p className="text-blue-100">Sistem Informasi Kependudukan - Data Terkini</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Data diperbarui: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Warga</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWarga}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5 bulan ini
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats.lakilaki}</span> Laki-laki, <span className="text-pink-600 dark:text-pink-400 font-semibold">{stats.perempuan}</span> Perempuan
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Keluarga</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                  <UsersRound className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalKeluarga}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2 bulan ini
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Rata-rata <span className="font-semibold text-green-600 dark:text-green-400">{(stats.totalWarga / (stats.totalKeluarga || 1)).toFixed(1)}</span> orang/KK
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Kelahiran</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-md">
                  <Baby className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalKelahiran}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Tahun ini
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Rata-rata <span className="font-semibold text-yellow-600 dark:text-yellow-400">1 kelahiran/bulan</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Kematian</CardTitle>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                  <HeartCrack className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalKematian}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    Tahun ini
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pertumbuhan: <span className="font-semibold text-green-600 dark:text-green-400">+{stats.totalKelahiran - stats.totalKematian} warga</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Distribusi Kelompok Usia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="jumlah" 
                      fill="url(#colorGradient)" 
                      radius={[8, 8, 0, 0]}
                      name="Jumlah Warga"
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  Distribusi per RT
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={rtDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="jumlah" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                      name="Jumlah Warga"
                    />
                    {/* Bar 'keluarga' dihapus karena kita tidak fetch data itu */}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Distribusi Agama
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={religionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, persen }) => `${name} ${persen}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {religionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Tren Kelahiran & Kematian (5 Bulan Terakhir)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="bulan" 
                      stroke="#6b7280"
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="kelahiran" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Kelahiran"
                      dot={{ fill: '#10b981', r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="kematian" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="Kematian"
                      dot={{ fill: '#ef4444', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Status Perkawinan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Kawin</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.kawin} orang</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(stats.kawin / (stats.totalWarga || 1) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Belum Kawin</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.belumKawin} orang</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(stats.belumKawin / (stats.totalWarga || 1) * 100)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 border-2 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <Baby className="h-4 w-4 text-white" />
                  </div>
                  Rasio Jenis Kelamin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Laki-laki</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.lakilaki} orang</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(stats.lakilaki / (stats.totalWarga || 1) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Perempuan</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.perempuan} orang</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: `${(stats.perempuan / (stats.totalWarga || 1) * 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    Rasio: {(stats.lakilaki / (stats.perempuan || 1) * 100).toFixed(0)} : 100
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-700 border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  Pertumbuhan Penduduk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Tahun ini</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">+{stats.totalKelahiran - stats.totalKematian}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300">Kelahiran</span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">+{stats.totalKilahiran}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-300">Kematian</span>
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">-{stats.totalKematian}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Tingkat pertumbuhan: {((stats.totalKelahiran - stats.totalKematian) / (stats.totalWarga || 1) * 100).toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}