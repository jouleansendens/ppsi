import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kematian: any; // Sebaiknya gunakan tipe yang lebih spesifik jika Anda punya
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

export function KematianDetailDialog({ open, onOpenChange, kematian }: Props) {
  if (!kematian) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Laporan Kematian</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <dl className="space-y-0">
            <DetailItem label="Nama Almarhum" value={kematian.nama_almarhum} />
            <DetailItem label="NIK" value={kematian.nik} />
            <DetailItem label="Tanggal Meninggal" value={formatDate(kematian.tanggal_meninggal)} />
            <DetailItem label="Tempat Meninggal" value={kematian.tempat_meninggal} />
            <DetailItem label="Sebab Kematian" value={kematian.sebab_kematian} />
            <DetailItem label="Keterangan" value={kematian.keterangan} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}