export type ComplaintStatus = "DIAJUKAN" | "DIPROSES" | "SELESAI";

export type Complaint = {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  status: ComplaintStatus;
  employee?: string;
  department?: string;
};

export const currentUser = {
  name: "Budi Santoso",
  nik: "1234567890",
  position: "Staff IT",
  department: "Information Technology",
  email: "budi.santoso@perusahaan.co.id",
};

export const adminComplaints: Complaint[] = [
  {
    id: "CMP-001",
    title: "AC Ruang Meeting Rusak",
    category: "Fasilitas",
    description: "AC di ruang meeting lantai 2 tidak dingin sama sekali.",
    date: "12 Okt 2026",
    status: "DIAJUKAN",
    employee: "Andi Saputra",
    department: "Marketing",
  },
  {
    id: "CMP-002",
    title: "Lampu Toilet Pria Mati",
    category: "Fasilitas",
    description: "Lampu di toilet pria lantai 3 mati total, mohon segera diganti.",
    date: "11 Okt 2026",
    status: "DIPROSES",
    employee: "Budi Santoso",
    department: "Information Technology",
  },
  {
    id: "CMP-003",
    title: "Kursi Patah",
    category: "Furnitur",
    description: "Kursi kerja saya patah di bagian roda.",
    date: "10 Okt 2026",
    status: "SELESAI",
    employee: "Cita Lestari",
    department: "Finance",
  },
];

export const employeeComplaints: Complaint[] = adminComplaints.filter(c => c.employee === "Budi Santoso");
