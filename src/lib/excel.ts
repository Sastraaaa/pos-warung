import * as XLSX from "xlsx";
import type { Product } from "../types";

export interface MappedProduct {
  name: string;
  category: string;
  capital_price: number;
  selling_price: number;
  current_stock: number;
}

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const generateProductTemplate = (): Blob => {
  const headers = [
    "Nama Produk",
    "Kategori",
    "Harga Modal",
    "Harga Jual",
    "Stok Awal",
  ];
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const exportProductsToExcel = (products: (Product & { checkout_count?: number })[]): Blob => {
  const data = products.map((p) => ({
    "Nama Produk": p.name,
    Kategori: p.category,
    "Harga Modal": p.capital_price,
    "Harga Jual": p.selling_price,
    "Stok Awal": p.current_stock,
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const mapExcelColumns = (data: any[]): MappedProduct[] => {
  return data.map((row) => {
    const mapped: any = {
      name: "",
      category: "",
      capital_price: 0,
      selling_price: 0,
      current_stock: 0,
    };

    for (const key in row) {
      const lowerKey = key.toLowerCase().trim();

      if (
        ["nama produk", "nama", "produk", "nama_barang", "barang"].includes(
          lowerKey,
        )
      ) {
        mapped.name = String(row[key]);
      } else if (
        ["kategori", "jenis", "category", "group"].includes(lowerKey)
      ) {
        mapped.category = String(row[key]);
      } else if (
        ["harga modal", "modal", "harga_beli", "harga beli", "beli"].includes(
          lowerKey,
        )
      ) {
        mapped.capital_price = Number(row[key]) || 0;
      } else if (
        ["harga jual", "jual", "harga_jual", "harga"].includes(lowerKey)
      ) {
        mapped.selling_price = Number(row[key]) || 0;
      } else if (
        ["stok", "stok awal", "stock", "jumlah", "qty"].includes(lowerKey)
      ) {
        mapped.current_stock = Number(row[key]) || 0;
      }
    }

    return mapped as MappedProduct;
  });
};

export const downloadTemplate = () => {
  const blob = generateProductTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "template_produk.xlsx";
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadExport = (products: (Product & { checkout_count?: number })[]) => {
  const blob = exportProductsToExcel(products);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "export_produk.xlsx";
  link.click();
  URL.revokeObjectURL(url);
};
