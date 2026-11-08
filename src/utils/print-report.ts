import type { Complaint } from "@/components/dashboard/data";

function escapeHtml(str?: string): string {
  if (!str) return "-";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function printComplaintReport(complaint: Complaint) {
  // Remove any leftover iframe
  const existingFrame = document.getElementById("sipka-print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "sipka-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const initialImages = (complaint.bukti_pengaduan || []).filter(
    (f) =>
      f.jenis_file?.startsWith("image/") ||
      f.path_file?.startsWith("data:image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(f.path_file || f.nama_file || "")
  );

  const completionImages = (complaint.bukti_penyelesaian || []).filter(
    (f) =>
      f.jenis_file?.startsWith("image/") ||
      f.path_file?.startsWith("data:image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(f.path_file || f.nama_file || "")
  );

  const nonImageBuktiPengaduan = (complaint.bukti_pengaduan || []).filter(
    (f) => !initialImages.includes(f)
  );

  const nonImageBuktiSelesai = (complaint.bukti_penyelesaian || []).filter(
    (f) => !completionImages.includes(f)
  );

  const statusLabel =
    complaint.status === "SELESAI"
      ? "SELESAI (TERTANGANI)"
      : complaint.status === "DIPROSES"
      ? "SEDANG DIPROSES"
      : complaint.status === "DIVERIFIKASI"
      ? "DIVERIFIKASI"
      : "DIAJUKAN";

  const statusColor =
    complaint.status === "SELESAI"
      ? "#047857"
      : complaint.status === "DIPROSES"
      ? "#6d28d9"
      : complaint.status === "DIVERIFIKASI"
      ? "#2563eb"
      : "#b45309";

  const statusBg =
    complaint.status === "SELESAI"
      ? "#d1fae5"
      : complaint.status === "DIPROSES"
      ? "#ede9fe"
      : complaint.status === "DIVERIFIKASI"
      ? "#dbeafe"
      : "#fef3c7";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan_Pengaduan_${escapeHtml(complaint.nomor_pengaduan)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      margin: 0;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.5;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #1e3a8a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #1e3a8a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
    }
    .header-text h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.3px;
    }
    .header-text p {
      margin: 2px 0 0;
      font-size: 10.5px;
      color: #475569;
    }
    .header-meta {
      text-align: right;
      font-size: 10.5px;
      color: #334155;
    }
    .ticket-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #1e3a8a;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 3px 8px;
      border-radius: 6px;
      margin-bottom: 4px;
    }
    .doc-title {
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f172a;
      margin: 12px 0 16px;
      padding: 7px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .status-pill {
      display: inline-block;
      padding: 3px 10px;
      font-weight: 700;
      font-size: 10.5px;
      border-radius: 9999px;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}40;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 9px;
      text-align: left;
      vertical-align: top;
      font-size: 10.5px;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      width: 26%;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
      border-left: 3.5px solid #1e3a8a;
      padding-left: 8px;
      margin: 14px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 12px;
      background: #f8fafc;
    }
    .box-success {
      border-color: #a7f3d0;
      background: #f0fdf4;
    }
    .box-info {
      border-color: #bfdbfe;
      background: #eff6ff;
    }
    .box-title {
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 4px;
      color: #065f46;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 8px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px;
      background: #ffffff;
      text-align: center;
    }
    .photo-card img {
      max-width: 100%;
      max-height: 150px;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #f1f5f9;
    }
    .photo-name {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-list {
      margin: 4px 0 0;
      padding-left: 18px;
      font-size: 10px;
      color: #475569;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 30%;
      text-align: center;
      font-size: 10.5px;
    }
    .sig-space {
      height: 52px;
    }
    .sig-name {
      font-weight: 700;
      border-top: 1px solid #475569;
      padding-top: 4px;
      color: #0f172a;
    }
    .footer-note {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      font-size: 9.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo-badge">GA</div>
      <div class="header-text">
        <h1>SIPKA</h1>
        <p>Sistem Informasi Pengaduan Karyawan · Divisi General Affairs</p>
      </div>
    </div>
    <div class="header-meta">
      <div class="ticket-badge">${escapeHtml(complaint.nomor_pengaduan)}</div>
      <div>Status: <span class="status-pill">${statusLabel}</span></div>
    </div>
  </div>

  <div class="doc-title">
    Laporan Rincian &amp; Hasil Penyelesaian Pengaduan Fasilitas
  </div>

  <div class="section-title">1. Informasi Tiket &amp; Pelapor</div>
  <table class="data-table">
    <tr>
      <th>Nomor Pengaduan</th>
      <td><strong>${escapeHtml(complaint.nomor_pengaduan)}</strong></td>
      <th>Status Pengaduan</th>
      <td><span class="status-pill">${statusLabel}</span></td>
    </tr>
    <tr>
      <th>Nama Pelapor</th>
      <td>${escapeHtml(complaint.employee || "Karyawan")}</td>
      <th>Departemen / Divisi</th>
      <td>${escapeHtml(complaint.department || "Operasional")}</td>
    </tr>
    <tr>
      <th>Kategori Fasilitas</th>
      <td>${escapeHtml(complaint.category)}</td>
      <th>Lokasi / Ruangan</th>
      <td>${escapeHtml(complaint.location)}</td>
    </tr>
    <tr>
      <th>Tanggal Masuk Laporan</th>
      <td>${escapeHtml(complaint.date)}</td>
      <th>Tanggal Selesai</th>
      <td><strong>${escapeHtml(complaint.tanggal_selesai || "-")}</strong></td>
    </tr>
  </table>

  <div class="section-title">2. Detail Keluhan &amp; Kerusakan</div>
  <div class="box">
    <p style="margin: 0 0 4px; font-weight: 700; font-size: 11.5px; color: #1e3a8a;">
      ${escapeHtml(complaint.title)}
    </p>
    <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-line;">
      ${escapeHtml(complaint.description)}
    </p>
  </div>

  ${
    initialImages.length > 0 || nonImageBuktiPengaduan.length > 0
      ? `
    <div class="section-title">3. Lampiran Bukti Pengaduan Awal</div>
    ${
      initialImages.length > 0
        ? `
      <div class="photo-grid">
        ${initialImages
          .map(
            (img, idx) => `
          <div class="photo-card">
            <img src="${img.path_file}" alt="Bukti ${idx + 1}" />
            <div class="photo-name">${escapeHtml(img.nama_file || `Bukti ${idx + 1}`)}</div>
          </div>
        `
          )
          .join("")}
      </div>
      `
        : ""
    }
    ${
      nonImageBuktiPengaduan.length > 0
        ? `
      <ul class="file-list">
        ${nonImageBuktiPengaduan
          .map(
            (f, idx) => `<li>Dokumen: ${escapeHtml(f.nama_file || `Lampiran ${idx + 1}`)}</li>`
          )
          .join("")}
      </ul>
      `
        : ""
    }
  `
      : ""
  }

  ${
    complaint.hasil_verifikasi || complaint.catatan_verifikasi || complaint.jenis_penanganan
      ? `
    <div class="section-title">${initialImages.length > 0 ? "4" : "3"}. Verifikasi &amp; Penanganan General Affairs</div>
    <table class="data-table">
      ${
        complaint.hasil_verifikasi
          ? `
        <tr>
          <th>Kelengkapan Data</th>
          <td>${escapeHtml(complaint.hasil_verifikasi)}</td>
        </tr>
      `
          : ""
      }
      ${
        complaint.catatan_verifikasi
          ? `
        <tr>
          <th>Catatan Verifikasi</th>
          <td>${escapeHtml(complaint.catatan_verifikasi)}</td>
        </tr>
      `
          : ""
      }
      ${
        complaint.jenis_penanganan
          ? `
        <tr>
          <th>Pihak Penanganan</th>
          <td>${complaint.jenis_penanganan === "VENDOR" ? "Vendor Eksternal" : "Tim GA Internal"}</td>
        </tr>
      `
          : ""
      }
      ${
        complaint.estimasi_selesai
          ? `
        <tr>
          <th>Estimasi Selesai</th>
          <td>${escapeHtml(complaint.estimasi_selesai)}</td>
        </tr>
      `
          : ""
      }
      ${
        complaint.catatan_penanganan
          ? `
        <tr>
          <th>Instruksi / Catatan Kerja</th>
          <td>${escapeHtml(complaint.catatan_penanganan)}</td>
        </tr>
      `
          : ""
      }
    </table>
  `
      : ""
  }

  ${
    complaint.status === "SELESAI" ||
    complaint.catatan_selesai ||
    completionImages.length > 0
      ? `
    <div class="section-title">${initialImages.length > 0 ? "5" : "4"}. Hasil &amp; Bukti Penyelesaian Perbaikan</div>
    <div class="box box-success">
      <div class="box-title">Catatan Penyelesaian Admin GA / Tim Teknisi:</div>
      <p style="margin: 0; color: #1e293b; line-height: 1.6; white-space: pre-line;">
        ${escapeHtml(complaint.catatan_selesai || "Perbaikan fasilitas telah selesai dan teruji berfungsi normal.")}
      </p>
    </div>

    ${
      completionImages.length > 0
        ? `
      <div style="font-size: 10.5px; font-weight: 700; color: #065f46; margin-top: 6px;">
        Foto Bukti Hasil Penyelesaian:
      </div>
      <div class="photo-grid">
        ${completionImages
          .map(
            (img, idx) => `
          <div class="photo-card">
            <img src="${img.path_file}" alt="Bukti Selesai ${idx + 1}" />
            <div class="photo-name">${escapeHtml(img.nama_file || `Bukti Selesai ${idx + 1}`)}</div>
          </div>
        `
          )
          .join("")}
      </div>
      `
        : ""
    }
    ${
      nonImageBuktiSelesai.length > 0
        ? `
      <ul class="file-list">
        ${nonImageBuktiSelesai
          .map(
            (f, idx) => `<li>Dokumen Penyelesaian: ${escapeHtml(f.nama_file || `Lampiran Selesai ${idx + 1}`)}</li>`
          )
          .join("")}
      </ul>
      `
        : ""
    }
  `
      : ""
  }

  <div class="signatures">
    <div class="sig-col">
      <div>Pelapor / Karyawan</div>
      <div class="sig-space"></div>
      <div class="sig-name">${escapeHtml(complaint.employee || "Karyawan")}</div>
      <div style="font-size: 9.5px; color: #64748b;">${escapeHtml(complaint.department || "Divisi")}</div>
    </div>
    <div class="sig-col">
      <div>Teknisi / Pelaksana</div>
      <div class="sig-space"></div>
      <div class="sig-name">${complaint.jenis_penanganan === "VENDOR" ? "Vendor Eksternal" : "Tim Teknisi GA"}</div>
      <div style="font-size: 9.5px; color: #64748b;">General Affairs</div>
    </div>
    <div class="sig-col">
      <div>Diverifikasi &amp; Disetujui</div>
      <div class="sig-space"></div>
      <div class="sig-name">Admin General Affairs</div>
      <div style="font-size: 9.5px; color: #64748b;">Divisi General Affairs</div>
    </div>
  </div>

  <div class="footer-note">
    <div>Dokumen ini dicetak otomatis melalui Sistem Informasi Pengaduan Karyawan (SIPKA).</div>
    <div>Dicetak pada: ${printDate}</div>
  </div>
</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Gagal mencetak dokumen:", e);
    }
  };

  // Wait for rendering
  setTimeout(triggerPrint, 500);
}
