import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DataWarga from "./pages/DataWarga";
import DataKeluarga from "./pages/DataKeluarga";
import Laporan from "./pages/Laporan";
import NotFound from "./pages/NotFound";
// 1. IMPORT HALAMAN BARU
import DetailKeluarga from "./pages/DetailKeluarga";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/warga"
                element={
                  <ProtectedRoute>
                    <DataWarga />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/keluarga"
                element={
                  <ProtectedRoute>
                    <DataKeluarga />
                  </ProtectedRoute>
                }
              />
              {/* 2. TAMBAHKAN RUTE BARU DI SINI */}
              <Route
                path="/keluarga/:id"
                element={
                  <ProtectedRoute>
                    <DetailKeluarga />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/laporan"
                element={
                  <ProtectedRoute>
                    <Laporan />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;