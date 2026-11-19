"use client";

import React, { useState, useRef } from "react";
import { X, ShieldCheck, AlertCircle, UploadCloud, FileText } from "lucide-react";

interface CertificationModalProps {
  employeeId: string;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CertificationModal({
  employeeId,
  employeeName,
  isOpen,
  onClose,
  onSuccess,
}: CertificationModalProps) {
  const [name, setName] = useState("");
  const [certificationId, setCertificationId] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);
  const [credentialUrl, setCredentialUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Certification title is required");
      return;
    }

    // BRD Rule: Mandatory certification ID
    if (!certificationId.trim()) {
      setError("Certification ID / License Credential ID is mandatory.");
      return;
    }

    if (!issuingBody.trim()) {
      setError("Issuing organization / body is required");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/v1/employees/${employeeId}/certifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          certificationId: certificationId.trim(),
          issuingBody: issuingBody.trim(),
          issueDate: issueDate || null,
          expiryDate: noExpiry ? null : expiryDate || null,
          credentialUrl: credentialUrl.trim() || null,
          fileName: selectedFile ? selectedFile.name : null,
          fileSize: selectedFile ? selectedFile.size : null,
          mimeType: selectedFile ? selectedFile.type : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save certification");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving certification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-hgv-navy">Add Professional Certification</h3>
              <p className="text-[11px] text-slate-500">{employeeName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Certification Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certification Title <span className="text-hgv-coral">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Certified Solutions Architect - Associate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
          </div>

          {/* Mandatory Certification ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certification / Credential ID <span className="text-hgv-coral">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS-PSA-991204, MSFT-AZ305-184"
              value={certificationId}
              onChange={(e) => setCertificationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Mandatory unique verification identifier issued by authority.
            </span>
          </div>

          {/* Issuing Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issuing Organization / Authority <span className="text-hgv-coral">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amazon Web Services, Microsoft, Oracle, ISTQB"
              value={issuingBody}
              onChange={(e) => setIssuingBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
          </div>

          {/* Issue & Expiry Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                disabled={noExpiry}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="noExpiry"
              checked={noExpiry}
              onChange={(e) => setNoExpiry(e.target.checked)}
              className="rounded border-slate-300 text-hgv-teal focus:ring-hgv-teal"
            />
            <label htmlFor="noExpiry" className="text-xs text-slate-600 select-none cursor-pointer">
              This certification does not expire (Lifetime validity)
            </label>
          </div>

          {/* Verification URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Verification URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://credly.com/badges/..."
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
          </div>

          {/* Document Proof Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certificate Document Proof (Optional PDF / Image)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:bg-slate-50 transition cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              {selectedFile ? (
                <div className="text-xs font-semibold text-hgv-navy flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-hgv-teal" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-slate-400 font-normal">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-600">Click to upload credential file</p>
                  <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Certification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
