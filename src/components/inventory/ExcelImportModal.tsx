import React, { useState } from "react";
import type { Product } from "../../types";
import {
  parseExcelFile,
  mapExcelColumns,
  downloadTemplate,
  type MappedProduct,
} from "../../lib/excel";

interface ExcelImportModalProps {
  onImport: (
    products: Omit<
      Product,
      "id" | "updated_at" | "low_stock_flag" | "checkout_count"
    >[],
  ) => void;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onImport,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MappedProduct[]>([]);
  const [error, setError] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    try {
      const data = await parseExcelFile(selectedFile);
      const mapped = mapExcelColumns(data);
      setPreview(mapped.slice(0, 5));
    } catch (err) {
      setError("Gagal membaca file excel.");
    }
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

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await parseExcelFile(file);
      const mapped = mapExcelColumns(data);
      onImport(mapped);
    } catch (err) {
      setError("Gagal mengimpor data.");
      setIsImporting(false);
    }
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
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-white">
              Preview Mapping (5 baris pertama)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2">Modal</th>
                    <th className="px-4 py-2">Jual</th>
                    <th className="px-4 py-2">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.category}</td>
                      <td className="px-4 py-2">{row.capital_price}</td>
                      <td className="px-4 py-2">{row.selling_price}</td>
                      <td className="px-4 py-2">{row.current_stock}</td>
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
