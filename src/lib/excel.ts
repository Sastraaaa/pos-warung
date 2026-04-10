import * as XLSX from "xlsx";
import type { Product } from "../types";

export interface MappedProduct {
  name: string;
  category: string;
  capital_price: number;
  selling_price: number;
  current_stock: number;
  barcode?: string;
  sku?: string;
  supplier?: string;
  catatan?: string;
}

export type ExcelRowStatus = "valid" | "invalid";

export interface ExcelRowValidationIssue {
  field: "name" | "capital_price" | "selling_price" | "current_stock";
  message: string;
}

export interface ExcelRowValidationResult {
  status: ExcelRowStatus;
  isValid: boolean;
  errors: ExcelRowValidationIssue[];
}

const REQUIRED_FIELD_ALIASES = {
  name: ["nama produk", "nama", "produk", "nama_barang", "barang", "product name"],
  category: ["kategori", "jenis", "category", "group", "kelompok"],
  capital_price: ["harga modal", "modal", "harga_beli", "harga beli", "beli", "capital price"],
  selling_price: ["harga jual", "jual", "harga_jual", "harga", "selling price"],
  current_stock: ["stok", "stok awal", "stock", "jumlah", "qty", "current stock"],
} as const;

const OPTIONAL_FIELD_ALIASES = {
  barcode: ["barcode", "kode batang", "kode_batang", "ean", "upc"],
  sku: ["sku", "kode sku", "kode_sku", "kode produk", "product code", "kode_barang"],
  supplier: ["supplier", "pemasok", "vendor"],
  catatan: ["catatan", "notes", "note", "keterangan", "remarks"],
} as const;

const normalizeText = (value: unknown): string => String(value ?? "").trim();

const normalizeHeader = (value: unknown): string => normalizeText(value).toLowerCase().replace(/\s+/g, " ");

const parseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const text = normalizeText(value);
  if (!text) return 0;

  const cleaned = text.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return 0;

  let normalized = cleaned;
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    normalized = normalized.replace(/,/g, ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const matchesAlias = (header: string, aliases: readonly string[]) => aliases.includes(header);

const setTextField = (target: Partial<MappedProduct>, key: keyof MappedProduct, value: unknown) => {
  const text = normalizeText(value);
  if (text) {
    target[key] = text as never;
  }
};

const setNumberField = (target: Partial<MappedProduct>, key: keyof MappedProduct, value: unknown) => {
  target[key] = parseNumber(value) as never;
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = reader.result;
        if (!(data instanceof ArrayBuffer)) {
          resolve([]);
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          resolve([]);
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
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
    const mapped: Partial<MappedProduct> = {
      name: "",
      category: "",
      capital_price: 0,
      selling_price: 0,
      current_stock: 0,
    };

    for (const [key, value] of Object.entries(row ?? {})) {
      const header = normalizeHeader(key);

      if (matchesAlias(header, REQUIRED_FIELD_ALIASES.name)) {
        setTextField(mapped, "name", value);
      } else if (matchesAlias(header, REQUIRED_FIELD_ALIASES.category)) {
        setTextField(mapped, "category", value);
      } else if (matchesAlias(header, REQUIRED_FIELD_ALIASES.capital_price)) {
        setNumberField(mapped, "capital_price", value);
      } else if (matchesAlias(header, REQUIRED_FIELD_ALIASES.selling_price)) {
        setNumberField(mapped, "selling_price", value);
      } else if (matchesAlias(header, REQUIRED_FIELD_ALIASES.current_stock)) {
        setNumberField(mapped, "current_stock", value);
      } else if (matchesAlias(header, OPTIONAL_FIELD_ALIASES.barcode)) {
        setTextField(mapped, "barcode", value);
      } else if (matchesAlias(header, OPTIONAL_FIELD_ALIASES.sku)) {
        setTextField(mapped, "sku", value);
      } else if (matchesAlias(header, OPTIONAL_FIELD_ALIASES.supplier)) {
        setTextField(mapped, "supplier", value);
      } else if (matchesAlias(header, OPTIONAL_FIELD_ALIASES.catatan)) {
        setTextField(mapped, "catatan", value);
      }
    }

    return mapped as MappedProduct;
  });
};

export const validateMappedProductRow = (row: MappedProduct): ExcelRowValidationResult => {
  const errors: ExcelRowValidationIssue[] = [];

  if (!normalizeText(row.name)) {
    errors.push({ field: "name", message: "Nama produk wajib diisi." });
  }

  if (row.capital_price < 0) {
    errors.push({ field: "capital_price", message: "Harga modal tidak boleh negatif." });
  }

  if (row.selling_price < 0) {
    errors.push({ field: "selling_price", message: "Harga jual tidak boleh negatif." });
  }

  if (row.current_stock < 0) {
    errors.push({ field: "current_stock", message: "Stok tidak boleh negatif." });
  }

  return {
    status: errors.length > 0 ? "invalid" : "valid",
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMappedProductRows = (rows: MappedProduct[]): ExcelRowValidationResult[] => {
  return rows.map((row) => validateMappedProductRow(row));
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
