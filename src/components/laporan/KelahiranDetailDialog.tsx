import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelahiran: any; // Sebaiknya gunakan tipe yang lebih spesifik jika Anda punya
}

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Komponen helper untuk menampilkan baris detail
const DetailItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-b-0">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="col-span-2 text-sm">{value || "-"}</dd>
  </div>
);

export function KelahiranDetailDialog({ open, onOpenChange, kelahiran }: Props) {
  if (!kelahiran) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Laporan Kelahiran</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <dl className="space-y-0">
            <DetailItem label="Nama Bayi" value={kelahiran.nama_bayi} />
            <DetailItem label="NIK Bayi" value={kelahiran.nik_bayi} />
            <DetailItem label="Jenis Kelamin" value={kelahiran.jenis_kelamin} />
            <DetailItem label="Tempat Lahir" value={kelahiran.tempat_lahir} />
            <DetailItem label="Tanggal Lahir" value={formatDate(kelahiran.tanggal_lahir)} />
            <DetailItem label="Nama Ayah" value={kelahiran.nama_ayah} />
            <DetailItem label="Nama Ibu" value={kelahiran.nama_ibu} />
            <DetailItem label="Keterangan" value={kelahiran.keterangan} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}