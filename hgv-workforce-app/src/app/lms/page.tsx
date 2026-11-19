"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { downloadCertificatePdf } from "@/lib/certificatePdf";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  PlayCircle,
  FileText,
  Shield,
  Download,
  ExternalLink,
  Search,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function LearnerPortalPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "MANDATORY" | "IN_PROGRESS" | "COMPLETED" | "CATALOG">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user's enrollments
      const enrRes = await fetch("/api/v1/lms/enrollments?scope=mine");
      if (enrRes.ok) {
        const data = await enrRes.json();
        setEnrollments(data.enrollments || []);
      }

      // Fetch elective / catalog courses
      const courseRes = await fetch("/api/v1/lms/courses");
      if (courseRes.ok) {
        const cData = await courseRes.json();
        setCatalogCourses(cData.courses || []);
      }
    } catch (err) {
      console.error("Failed to load LMS learner portal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      const res = await fetch("/api/v1/lms/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        await fetchData();
        setActiveTab("ALL");
      }
    } catch (err) {
      console.error("Failed to enroll:", err);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Metrics
  const totalEnrolled = enrollments.length;
  const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
  const inProgressCount = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const overdueCount = enrollments.filter((e) => e.isOverdue).length;
  const dueSoonCount = enrollments.filter((e) => {
    if (e.status === "COMPLETED" || !e.dueDate) return false;
    const diffDays = Math.ceil((new Date(e.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  }).length;

  const urgentEnrollments = enrollments.filter((e) => e.isOverdue || (!e.isOverdue && e.status !== "COMPLETED" && e.dueDate && Math.ceil((new Date(e.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7));

  // Filtered enrollments
  const filteredEnrollments = enrollments.filter((enr) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        enr.course.title.toLowerCase().includes(q) ||
        enr.course.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (activeTab === "MANDATORY") return enr.course.isMandatory;
    if (activeTab === "IN_PROGRESS") return enr.status === "IN_PROGRESS" || enr.status === "ASSIGNED";
    if (activeTab === "COMPLETED") return enr.status === "COMPLETED";
    return true;
  });

  // Catalog courses not yet enrolled in
  const availableCatalogCourses = catalogCourses.filter((c) => {
    const alreadyEnrolled = enrollments.some((e) => e.courseId === c.id);
    if (alreadyEnrolled) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Certificates list
  const earnedCertificates = enrollments
    .filter((e) => e.certificate)
    .map((e) => ({
      ...e.certificate,
      courseTitle: e.course.title,
      category: e.course.category,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Learning & Compliance (ELMS)", href: "/lms" }, { label: "Learner Portal" }]} />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hgv-teal/15 text-hgv-teal border border-hgv-teal/30">
                Enterprise Learning & Compliance Platform (ELMS)
              </span>
              <span className="text-xs text-slate-400">SOC 2 Type II & ISO 27001</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Learner Portal & Dashboard</h1>
            <p className="text-xs text-slate-500">
              Welcome back, <span className="font-semibold text-slate-800">{user?.displayName}</span>. Track your mandatory certifications and skill electives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWalletOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-hgv-teal text-slate-700 hover:text-hgv-navy rounded-xl shadow-xs text-xs font-semibold transition"
            >
              <Award className="w-4 h-4 text-hgv-teal" />
              <span>Digital Certificate Wallet ({earnedCertificates.length})</span>
            </button>
          </div>
        </div>

        {/* Priority / Urgent Overdue Alert Banner (FR-LEARN-01) */}
        {urgentEnrollments.length > 0 && (
          <div className="bg-linear-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-900">
                    High-Priority Compliance Deadlines ({urgentEnrollments.length})
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full text-[10px] font-bold">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-0.5">
                  The following mandatory regulatory courses are overdue or nearing their strict SLA cutoff. Please complete them to prevent managerial escalation and preserve enterprise compliance.
                </p>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {urgentEnrollments.map((enr) => {
                    const daysDiff = enr.dueDate
                      ? Math.ceil((new Date(enr.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div
                        key={enr.id}
                        className="bg-white/90 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{enr.course.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {enr.isOverdue ? (
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Overdue by {Math.abs(daysDiff)} days
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Due in {daysDiff} days
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {enr.progressPercent}% done
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/lms/learn/${enr.courseId}?enrollmentId=${enr.id}`}
                          className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
                        >
                          <span>{enr.progressPercent > 0 ? "Resume" : "Start"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Scorecards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Completed Courses</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{completedCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{totalEnrolled} total enrolled</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">In Progress</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{inProgressCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Resume where left off</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Certificates Earned</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-hgv-teal flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{earnedCertificates.length}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">SHA-256 Verifiable</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Overdue Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{overdueCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dueSoonCount > 0 ? `${dueSoonCount} due in < 7 days` : "All on track"}
            </p>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Navigation Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "ALL"
                    ? "bg-hgv-navy text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Courses ({enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab("MANDATORY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === "MANDATORY"
                    ? "bg-hgv-navy text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>Mandatory Compliance</span>
              </button>
              <button
                onClick={() => setActiveTab("IN_PROGRESS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "IN_PROGRESS"
                    ? "bg-hgv-navy text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setActiveTab("COMPLETED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "COMPLETED"
                    ? "bg-hgv-navy text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setActiveTab("CATALOG")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === "CATALOG"
                    ? "bg-hgv-teal text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-hgv-sky" />
                <span>Elective Catalog ({availableCatalogCourses.length})</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses or topics..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-6">
            {activeTab === "CATALOG" ? (
              // Elective Course Catalog
              availableCatalogCourses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No elective courses available or all already enrolled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCatalogCourses.map((c) => (
                    <div
                      key={c.id}
                      className="border border-slate-200 rounded-2xl p-5 hover:border-hgv-teal/50 hover:shadow-md transition bg-linear-to-b from-white to-slate-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {c.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {c.estimatedDurationMinutes} mins
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-800">{c.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Passing: <span className="font-semibold text-slate-700">{c.passingScore}%</span>
                        </span>
                        <button
                          onClick={() => handleSelfEnroll(c.id)}
                          disabled={enrollingCourseId === c.id}
                          className="px-3 py-1.5 bg-hgv-teal hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{enrollingCourseId === c.id ? "Enrolling..." : "Enroll Now"}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No courses matching your filter</p>
                <p className="text-xs text-slate-400 mt-1">Explore the Elective Catalog to discover professional tracks.</p>
              </div>
            ) : (
              // Active Enrollments List
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnrollments.map((enr) => {
                  const course = enr.course;
                  const isCompleted = enr.status === "COMPLETED";
                  const isOverdue = enr.isOverdue;

                  const daysUntilDue = enr.dueDate
                    ? Math.ceil((new Date(enr.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <div
                      key={enr.id}
                      className={`border rounded-2xl p-5 flex flex-col justify-between transition shadow-xs ${
                        isOverdue
                          ? "border-rose-300 bg-rose-50/20"
                          : isCompleted
                          ? "border-emerald-200 bg-emerald-50/15"
                          : "border-slate-200 bg-white hover:border-hgv-teal/40 hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            {course.isMandatory ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                Mandatory
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                Elective
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">{course.category}</span>
                          </div>

                          {/* Status Badge */}
                          {isCompleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Completed
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Overdue
                            </span>
                          ) : daysUntilDue <= 7 && daysUntilDue > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Due in {daysUntilDue}d
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                              {enr.status === "IN_PROGRESS" ? "In Progress" : "Assigned"}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-sm text-slate-800 leading-snug">{course.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-500 font-medium">Curriculum Progress</span>
                            <span className="font-bold text-slate-700">{enr.progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : isOverdue
                                  ? "bg-rose-500"
                                  : "bg-hgv-teal"
                              }`}
                              style={{ width: `${enr.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Due Date & Cadence */}
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isCompleted
                              ? `Completed on ${new Date(enr.completedAt).toLocaleDateString()}`
                              : `Due: ${enr.dueDate ? new Date(enr.dueDate).toLocaleDateString() : "Flexible"}`}
                          </span>
                          {course.recertificationDays > 0 && (
                            <span>{course.recertificationDays}d Cadence</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {isCompleted && enr.certificate ? (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => {
                                setSelectedCert({
                                  ...enr.certificate,
                                  courseTitle: course.title,
                                  courseCategory: course.category,
                                });
                                setWalletOpen(true);
                              }}
                              className="flex-1 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-hgv-teal border border-teal-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>View Certificate</span>
                            </button>

                            <Link
                              href={`/lms/learn/${course.id}?enrollmentId=${enr.id}`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                              title="Review Course Materials"
                            >
                              <BookOpen className="w-4 h-4" />
                            </Link>
                          </div>
                        ) : (
                          <Link
                            href={`/lms/learn/${course.id}?enrollmentId=${enr.id}`}
                            className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                              isOverdue
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-hgv-navy hover:bg-slate-800 text-white"
                            }`}
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>
                              {enr.progressPercent > 0 ? "Resume Course" : "Start Course"}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Digital Certificate Wallet Modal (FR-LEARN-03, FR-LEARN-04) */}
        {walletOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Verifiable Digital Certificate Wallet</h2>
                    <p className="text-[11px] text-slate-500">Cryptographically signed credentials conforming to SOC 2 Type II</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWalletOpen(false);
                    setSelectedCert(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                {earnedCertificates.length === 0 ? (
                  <div className="text-center py-10">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No certificates earned yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Pass end-of-module assessments with score ≥ 80% to generate official verifiable certificates.</p>
                  </div>
                ) : (
                  earnedCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="border border-slate-200 rounded-xl p-4 bg-linear-to-r from-teal-50/30 via-white to-sky-50/30 hover:border-hgv-teal/50 transition shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                              {cert.certificateNumber}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              VERIFIED ACTIVE
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 mt-1.5">{cert.courseTitle}</h4>
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>Recipient: <strong className="text-slate-700">{cert.userName}</strong></span>
                            <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                            <span>Expires: {new Date(cert.expiresAt).toLocaleDateString()}</span>
                            <span>Score: <strong className="text-hgv-teal">{cert.scorePercent}%</strong></span>
                          </div>

                          <div className="mt-2 text-[10px] font-mono text-slate-400 truncate max-w-md">
                            SHA-256: {cert.verificationHash}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              downloadCertificatePdf({
                                certificateNumber: cert.certificateNumber,
                                recipientName: cert.userName,
                                recipientEmail: cert.userEmail,
                                courseTitle: cert.courseTitle,
                                courseCategory: cert.category,
                                issuedAt: cert.issuedAt,
                                expiresAt: cert.expiresAt,
                                scorePercent: cert.scorePercent,
                                verificationHash: cert.verificationHash,
                              })
                            }
                            className="px-3 py-1.5 bg-hgv-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>

                          <Link
                            href={`/lms/verify?query=${cert.certificateNumber}`}
                            target="_blank"
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-hgv-teal text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-hgv-teal" />
                            <span>Verify URL</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>Tamper-evident verification standard: SOC 2 & ISO/IEC 27001</span>
                <button
                  onClick={() => setWalletOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
