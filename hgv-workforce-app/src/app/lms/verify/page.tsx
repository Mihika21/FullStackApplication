"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { downloadCertificatePdf } from "@/lib/certificatePdf";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Award,
  Calendar,
  Building,
  User,
  ExternalLink,
  ArrowRight,
  FileCheck,
} from "lucide-react";

function CertificateVerificationContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query") || "";

  const [inputQuery, setInputQuery] = useState(queryParam);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (queryParam) {
      performVerification(queryParam);
    }
  }, [queryParam]);

  const performVerification = async (q: string) => {
    if (!q.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/v1/lms/verify?query=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error(err);
      setVerificationResult({ verified: false, status: "ERROR", message: "Failed to verify credential" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(inputQuery);
  };

  const cert = verificationResult?.certificate;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Learning & Compliance (ELMS)", href: "/lms" }, { label: "Statutory Certificate Verification" }]} />

        {/* Header Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-hgv-teal border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-hgv-teal" />
            <span>Statutory Verification Portal (FR-LEARN-04)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Digital Certificate Verification Registry
          </h1>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Validate the authenticity, issuance date, and cryptographic integrity of enterprise compliance certifications conforming to SOC 2 Type II and ISO/IEC 27001:2022 standards.
          </p>
        </div>

        {/* Verification Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Enter Certificate Number (e.g. CERT-2026-POSH-2005) or SHA-256 Hash..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-hgv-teal hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify Credential"}</span>
            </button>
          </form>

          {/* Quick Examples */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>Quick sample test:</span>
            <button
              type="button"
              onClick={() => {
                setInputQuery("CERT-2026-POSH-");
                performVerification("CERT-2026-POSH-");
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition"
            >
              CERT-2026-POSH-2000
            </button>
            <button
              type="button"
              onClick={() => {
                setInputQuery("CERT-2026-CYBER-1000");
                performVerification("CERT-2026-CYBER-1000");
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition"
            >
              CERT-2026-CYBER-1000
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {searched && verificationResult && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {verificationResult.verified && cert ? (
              // Verified Certificate Card
              <div className="bg-white border-2 border-emerald-500/40 rounded-2xl shadow-xl overflow-hidden">
                {/* Status Bar */}
                <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">VERIFIED AUTHENTIC CREDENTIAL</h3>
                      <p className="text-[11px] text-emerald-100">Cryptographically confirmed on official regulatory registry</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-bold">
                    {cert.certificateNumber}
                  </span>
                </div>

                {/* Details Body */}
                <div className="p-6 space-y-6">
                  {/* Recipient & Course */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Certificate Holder
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{cert.recipientName}</h2>
                      <p className="text-xs text-slate-500 font-mono">{cert.recipientEmail}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Accredited Curriculum
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{cert.courseTitle}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {cert.courseCategory}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          Score: {cert.scorePercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Authority */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Date of Issuance
                      </span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Expiration &amp; Recertification
                      </span>
                      <p className="font-semibold text-slate-800 mt-1">
                        {new Date(cert.expiresAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Accreditation Standard
                      </span>
                      <p className="font-semibold text-slate-800 mt-1">
                        SOC 2 Type II &amp; ISO 27001
                      </p>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Proof */}
                  <div className="p-4 bg-slate-900 rounded-xl text-white space-y-1 font-mono text-[11px]">
                    <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                      Cryptographic Digital Signature (SHA-256):
                    </span>
                    <p className="text-slate-300 break-all select-all">{cert.verificationHash}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Issuing Authority: {cert.issuingAuthority}
                    </span>

                    <button
                      onClick={() =>
                        downloadCertificatePdf({
                          certificateNumber: cert.certificateNumber,
                          recipientName: cert.recipientName,
                          recipientEmail: cert.recipientEmail,
                          courseTitle: cert.courseTitle,
                          courseCategory: cert.courseCategory,
                          issuedAt: cert.issuedAt,
                          expiresAt: cert.expiresAt,
                          scorePercent: cert.scorePercent,
                          verificationHash: cert.verificationHash,
                        })
                      }
                      className="px-4 py-2 bg-hgv-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-hgv-teal" />
                      <span>Download Official PDF Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Not Found / Invalid Card
              <div className="bg-white border-2 border-rose-300 rounded-2xl p-8 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {verificationResult.status === "EXPIRED"
                    ? "Credential Has Expired"
                    : "No Verified Credential Found"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {verificationResult.message || "Please check the Certificate Number or Hash and verify spelling."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading Verification Portal...
        </div>
      }
    >
      <CertificateVerificationContent />
    </Suspense>
  );
}
