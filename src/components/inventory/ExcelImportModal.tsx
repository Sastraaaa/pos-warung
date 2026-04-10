import React, { useState } from "react";
import type { Product } from "../../types";
import {
  parseExcelFile,
  mapExcelColumns,
  downloadTemplate,
  validateMappedProductRow,
  type MappedProduct,
} from "../../lib/excel";

interface ExcelImportModalProps {
  existingProducts: Product[];
  onImport: (
    result: {
      validRows: Omit<
        Product,
        "id" | "updated_at" | "low_stock_flag" | "checkout_count"
      >[];
      summary: { valid: number; duplicate: number; invalid: number };
    }
  ) => void;
  onClose: () => void;
}

type RowStatus = "valid" | "duplicate" | "invalid";

interface PreviewRow extends MappedProduct {
  _status: RowStatus;
  _errors: string[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  existingProducts,
  onImport,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState({ valid: 0, duplicate: 0, invalid: 0 });
  const [error, setError] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const checkDuplicate = (row: MappedProduct) => {
    return existingProducts.some((p) => {
      if (row.barcode && p.barcode && row.barcode === p.barcode) return true;
      if (row.sku && p.sku && row.sku === p.sku) return true;
      if (
        row.name &&
        p.name &&
        row.name.trim().toLowerCase() === p.name.trim().toLowerCase()
      )
        return true;
      return false;
    });
  };

  const processFile = async (selectedFile: File) => {
    try {
      const data = await parseExcelFile(selectedFile);
      const mapped = mapExcelColumns(data);
      
      let valid = 0;
      let duplicate = 0;
      let invalid = 0;

      const processedRows: PreviewRow[] = mapped.map((row) => {
        const validation = validateMappedProductRow(row);
        const isDuplicate = checkDuplicate(row);
        
        let status: RowStatus = "valid";
        const errors = validation.errors.map((e) => e.message);

        if (!validation.isValid) {
          status = "invalid";
          invalid++;
        } else if (isDuplicate) {
          status = "duplicate";
          duplicate++;
          errors.push("Produk sudah ada di database");
        } else {
          valid++;
        }

        return { ...row, _status: status, _errors: errors };
      });

      setPreview(processedRows);
      setSummary({ valid, duplicate, invalid });
    } catch (err) {
      setError("Gagal membaca file excel.");
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".csv") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      setError("Mohon upload file .xlsx atau .csv");
      return;
    }
    setFile(selectedFile);
    setError("");
    await processFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setIsImporting(true);
    
    const validRows = preview
      .filter((r) => r._status === "valid")
      .map(({ _status, _errors, ...product }) => product);

    onImport({ validRows, summary });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Import Data Produk
        </h2>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Upload file Excel atau CSV untuk menambahkan produk secara massal.
          </p>
          <button
            onClick={downloadTemplate}
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Download Template
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            isDragOver
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800"
          }`}
        >
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            onChange={handleChange}
          />
          <div className="text-center">
            {file ? (
              <p className="font-medium text-white">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-300">
                  Tarik dan lepas file di sini
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  atau klik untuk memilih file (.xlsx, .csv)
                </p>
              </>
            )}
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {preview.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Valid: {summary.valid}
              </span>
              <span className="flex items-center gap-1.5 text-yellow-400">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                Duplikat: {summary.duplicate}
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                Tidak Valid: {summary.invalid}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
              <table className="w-full text-left text-sm text-slate-300 relative">
                <thead className="sticky top-0 bg-slate-700/90 backdrop-blur-sm text-xs uppercase text-slate-400 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2">Modal</th>
                    <th className="px-4 py-2">Jual</th>
                    <th className="px-4 py-2">Stok</th>
                    <th className="px-4 py-2">Barcode</th>
                    <th className="px-4 py-2">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {preview.map((row, idx) => (
                    <tr key={idx} className={row._status === "invalid" ? "bg-red-500/5" : row._status === "duplicate" ? "bg-yellow-500/5" : ""}>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row._status === "valid"
                              ? "bg-green-500/10 text-green-400"
                              : row._status === "duplicate"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                          title={row._errors.join(", ")}
                        >
                          {row._status === "valid" ? "Valid" : row._status === "duplicate" ? "Duplikat" : "Error"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.category}</td>
                      <td className="px-4 py-2">{row.capital_price}</td>
                      <td className="px-4 py-2">{row.selling_price}</td>
                      <td className="px-4 py-2">{row.current_stock}</td>
                      <td className="px-4 py-2">{row.barcode || "-"}</td>
                      <td className="px-4 py-2">{row.sku || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            disabled={isImporting}
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${
              !file || isImporting
                ? "cursor-not-allowed bg-blue-600/50"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {isImporting ? "Mengimpor..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
};
