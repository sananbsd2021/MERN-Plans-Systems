import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Extend jsPDF with autotable for TypeScript
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToPDF = (title: string, columns: string[], data: any[][], fileName: string) => {
  const doc = new jsPDF();
  
  // Add Thai font support would be ideal, but for now using default
  // Note: standard fonts don't support Thai well. In production, we'd add a custom font.
  
  doc.text(title, 14, 15);
  doc.autoTable({
    startY: 20,
    head: [columns],
    body: data,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
  });
  
  doc.save(`${fileName}.pdf`);
};

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
