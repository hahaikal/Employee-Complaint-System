export type ComplaintStatus = "Diajukan" | "Diverifikasi" | "Diproses" | "Selesai";

export const currentUser = {
  name: "Budi Santoso",
  role: "Karyawan",
  initials: "BS",
};

export const summary = {
  total: 12,
  submitted: 3,
  processing: 5,
  resolved: 4,
};

export const recentComplaints = [
  { id: "CMP-001", date: "2026-09-30", title: "AC Ruang Meeting Rusak", category: "Elektronik", status: "Diajukan" as ComplaintStatus },
  { id: "CMP-002", date: "2026-09-28", title: "Lampu Toilet Mati", category: "Listrik", status: "Diproses" as ComplaintStatus },
  { id: "CMP-003", date: "2026-09-25", title: "Kursi Patah", category: "Furnitur", status: "Selesai" as ComplaintStatus },
];
