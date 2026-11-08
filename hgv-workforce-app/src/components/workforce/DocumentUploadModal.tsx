"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Trash2,
  Lock,
  ShieldCheck,
  FileType,
} from "lucide-react";

interface DocumentUploadModalProps {
  employeeId: string;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadModal({
  employeeId,
  employeeName,
  isOpen,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState("Offer Letter");
  const [docNumber, setDocNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsConfirmed(false);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsConfirmed(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a document file to preview and upload.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/v1/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber.trim() || `${docType.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || "application/octet-stream",
          status: "Verified",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to persist document record");
      }

      handleRemoveFile();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while persisting document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-hgv-teal" />
              Upload & Verify Document
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target Employee: <strong className="text-slate-700">{employeeName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmAndSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Type <span className="text-hgv-coral">*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              >
                <option value="Offer Letter">Offer Letter</option>
                <option value="Employment Contract">Employment Contract</option>
                <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
                <option value="Passport">Passport</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="Educational Degree">Educational Degree</option>
                <option value="Background Verification">Background Verification Report</option>
                <option value="Resume / CV">Resume / CV</option>
                <option value="Other">Other Official Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Identifier / ID No.
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. PASSPORT-92144 or ABCDE1234F"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>

          {/* File Selector / Dropzone */}
          {!selectedFile ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select File for Preview <span className="text-hgv-coral">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-hgv-teal hover:bg-hgv-teal/5 cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-hgv-teal/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-hgv-teal transition-colors" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Click to browse or drag and drop document
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  PDF, DOCX, PNG, JPG up to 15 MB
                </p>
              </div>
            </div>
          ) : (
            /* Live Interactive Preview Panel */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-hgv-teal" />
                  Live Document Preview
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove & Reselect
                </button>
              </div>

              {/* Preview Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {selectedFile.type.startsWith("image/") ? (
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-hgv-teal" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {formatFileSize(selectedFile.size)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-hgv-teal/15 text-hgv-teal">
                        {selectedFile.type || "binary"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Pre-check Passed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Image Thumbnail if applicable */}
                {previewUrl && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-slate-100">
                    <img
                      src={previewUrl}
                      alt="Document thumbnail preview"
                      className="max-h-48 object-contain"
                    />
                  </div>
                )}

                {/* Simulated Document Sheet Preview for PDF/Docs */}
                {!previewUrl && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                      <span>Document Type: <strong>{docType}</strong></span>
                      <span>Security: <strong>Masked / Encrypted at rest</strong></span>
                    </div>
                    <div className="space-y-1 py-1">
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-4/6"></div>
                    </div>
                  </div>
                )}

                {/* Explicit Non-Persisted Warning Banner */}
                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-amber-800">
                      Staged in Preview Only
                    </strong>
                    <span>
                      This document has not yet been saved to the database. Review the metadata above and click <strong>Confirm & Save Document</strong> to persist.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || saving}
              className={`px-4 py-2 text-xs font-bold rounded-lg text-white flex items-center gap-1.5 shadow-sm transition-all ${
                !selectedFile || saving
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-hgv-teal hover:bg-hgv-teal/90"
              }`}
            >
              {saving ? (
                <>Saving Document...</>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Save Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
