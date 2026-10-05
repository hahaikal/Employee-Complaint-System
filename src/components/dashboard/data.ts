export type ComplaintStatus = "DIAJUKAN" | "DIVERIFIKASI" | "DIPROSES" | "SELESAI";

export type Complaint = {
  id: string;
  nomor_pengaduan: string;
  title: string;
  category: string;
  description: string;
  date: string;
  status: ComplaintStatus;
  employee?: string;
  department?: string;
};
