"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Plus,
  Search,
  Shield,
  Clock,
  Award,
  Layers,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ExternalLink,
  X,
  Lock,
} from "lucide-react";

export default function CourseCmsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [filterMandatory, setFilterMandatory] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Cybersecurity & IT");
  const [formIsMandatory, setFormIsMandatory] = useState(true);
  const [formRecertDays, setFormRecertDays] = useState(365);
  const [formPassingScore, setFormPassingScore] = useState(80);
  const [formDuration, setFormDuration] = useState(45);
  const [formEnforceVideo, setFormEnforceVideo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/lms/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        isMandatory: formIsMandatory,
        recertificationDays: formRecertDays,
        passingScore: formPassingScore,
        estimatedDurationMinutes: formDuration,
        enforceVideoCompletion: formEnforceVideo,
      };

      let res;
      if (editingCourse) {
        res = await fetch(`/api/v1/lms/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/v1/lms/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setCreateModalOpen(false);
        setEditingCourse(null);
        resetForm();
        await fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save course");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Cybersecurity & IT");
    setFormIsMandatory(true);
    setFormRecertDays(365);
    setFormPassingScore(80);
    setFormDuration(45);
    setFormEnforceVideo(true);
  };

  const openEditModal = (c: any) => {
    setEditingCourse(c);
    setFormTitle(c.title);
    setFormDescription(c.description);
    setFormCategory(c.category);
    setFormIsMandatory(c.isMandatory);
    setFormRecertDays(c.recertificationDays);
    setFormPassingScore(c.passingScore);
    setFormDuration(c.estimatedDurationMinutes);
    setFormEnforceVideo(c.enforceVideoCompletion);
    setCreateModalOpen(true);
  };

  const categories = [
    "Cybersecurity & IT",
    "Legal, Ethics & Compliance",
    "Data Privacy",
    "Safety",
    "Engineering",
    "Leadership",
  ];

  const filteredCourses = courses.filter((c) => {
    if (selectedCategory !== "ALL" && c.category !== selectedCategory) return false;
    if (filterMandatory === "MANDATORY" && !c.isMandatory) return false;
    if (filterMandatory === "ELECTIVE" && c.isMandatory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <Breadcrumbs crumbs={[{ label: "Learning & Compliance (ELMS)", href: "/lms" }, { label: "Course Catalog & CMS" }]} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hgv-teal/15 text-hgv-teal border border-hgv-teal/30">
                Course Authoring &amp; CMS (FR-CMS)
              </span>
              <span className="text-xs text-slate-400">Content Management System</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Enterprise Course Catalog &amp; CMS</h1>
            <p className="text-xs text-slate-500">
              Author and publish regulatory compliance curriculums, configure recertification cadences, and manage interactive lessons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.roleCode === "HR_MANAGER" && (
              <button
                onClick={() => {
                  setEditingCourse(null);
                  resetForm();
                  setCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-hgv-navy hover:bg-slate-800 text-white rounded-xl shadow-xs text-xs font-bold transition"
              >
                <Plus className="w-4 h-4 text-hgv-teal" />
                <span>Create New Course</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterMandatory}
              onChange={(e) => setFilterMandatory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            >
              <option value="ALL">All Types</option>
              <option value="MANDATORY">Mandatory Only</option>
              <option value="ELECTIVE">Electives Only</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by keyword..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => {
            const moduleCount = c.modules?.length || 0;
            const lessonCount = c.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0;
            const hasQuiz = c.modules?.some((m: any) => m.quiz);

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-hgv-teal/40 hover:shadow-md transition shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {c.isMandatory ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" />
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Elective
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{c.category}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Specifications */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{moduleCount} Module{moduleCount !== 1 ? "s" : ""}, {lessonCount} Lesson{lessonCount !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.estimatedDurationMinutes} mins duration</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-hgv-teal" />
                      <span>Pass: {c.passingScore}% threshold</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {c.enforceVideoCompletion ? (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Lock className="w-3 h-3" />
                          <span>Video locked</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Flexible scrubbing</span>
                      )}
                    </div>
                  </div>

                  {/* Enrollment Stats */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 p-2 rounded-xl">
                    <span>
                      Enrollments: <strong className="text-slate-700">{c._count?.enrollments || 0}</strong>
                    </span>
                    <span>
                      Certificates: <strong className="text-emerald-600">{c._count?.certificates || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {user?.roleCode === "HR_MANAGER" && (
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Settings</span>
                    </button>
                  )}

                  <Link
                    href={`/lms/learn/${c.id}`}
                    className="px-3 py-1.5 bg-hgv-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Preview Course</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create / Edit Modal (FR-CMS-01, FR-CMS-04) */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-hgv-navy text-white flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {editingCourse ? "Edit Course Settings" : "Author New Compliance Course"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Configure regulatory metadata, passing score, and cadence</p>
                  </div>
                </div>

                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdateCourse} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Annual Insider Trading & Whistleblower Policy 2027"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Comprehensive overview of policy guidelines and compliance mandates..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Compliance?</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="mandatory"
                          checked={formIsMandatory}
                          onChange={() => setFormIsMandatory(true)}
                          className="text-hgv-teal"
                        />
                        <span>Mandatory</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="mandatory"
                          checked={!formIsMandatory}
                          onChange={() => setFormIsMandatory(false)}
                          className="text-hgv-teal"
                        />
                        <span>Elective</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cadence (Days)</label>
                    <input
                      type="number"
                      value={formRecertDays}
                      onChange={(e) => setFormRecertDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400">e.g. 365 days</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Passing Score (%)</label>
                    <input
                      type="number"
                      value={formPassingScore}
                      onChange={(e) => setFormPassingScore(parseInt(e.target.value) || 80)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400">e.g. 80%</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(parseInt(e.target.value) || 45)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400">Estimated duration</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Enforce Video Completion Lock</p>
                    <p className="text-[10px] text-slate-500">
                      Disables skipping/scrubbing forward in mandatory compliance videos
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formEnforceVideo}
                    onChange={(e) => setFormEnforceVideo(e.target.checked)}
                    className="w-4 h-4 text-hgv-teal rounded"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-hgv-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    {submitting ? "Saving..." : editingCourse ? "Save Changes" : "Publish Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
