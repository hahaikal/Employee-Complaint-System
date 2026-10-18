export type ComplaintStatus = "DIAJUKAN" | "DIVERIFIKASI" | "DIPROSES" | "SELESAI";

export type EvidenceFile = {
  id?: string;
  nama_file?: string;
  path_file: string;
  jenis_file?: string;
  keterangan?: string;
};

export type Complaint = {
  id: string;
  nomor_pengaduan: string;
  title: string;
  category: string;
  description: string;
  location?: string;
  date: string;
  status: ComplaintStatus;
  employee?: string;
  department?: string;
  bukti_pengaduan?: EvidenceFile[];
  bukti_penyelesaian?: EvidenceFile[];
  hasil_verifikasi?: string;
  catatan_verifikasi?: string;
  jenis_penanganan?: string;
  estimasi_selesai?: string;
  catatan_penanganan?: string;
  catatan_selesai?: string;
  tanggal_selesai?: string;
};
