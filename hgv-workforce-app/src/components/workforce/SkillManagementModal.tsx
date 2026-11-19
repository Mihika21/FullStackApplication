"use client";

import React, { useState, useEffect } from "react";
import { X, Award, AlertCircle, CheckCircle2, Plus, Sparkles } from "lucide-react";

interface SkillManagementModalProps {
  employeeId: string;
  employeeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSkill?: any;
}

const PROFICIENCY_LEVELS = [
  { level: 0, label: "0 - No Exposure", desc: "Has not worked with this skill" },
  { level: 1, label: "1 - Awareness", desc: "Understands concepts; needs guidance" },
  { level: 2, label: "2 - Working", desc: "Applies skill independently on routine tasks" },
  { level: 3, label: "3 - Proficient", desc: "Works independently; handles non-routine tasks" },
  { level: 4, label: "4 - Advanced", desc: "Solves complex problems; mentors peers" },
  { level: 5, label: "5 - Expert", desc: "Recognised authority; sets GCC standards" },
];

export function SkillManagementModal({
  employeeId,
  employeeName,
  isOpen,
  onClose,
  onSuccess,
  initialSkill,
}: SkillManagementModalProps) {
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selfRating, setSelfRating] = useState(0);
  const [validatedRating, setValidatedRating] = useState(0);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | string>(0);
  const [lastUsed, setLastUsed] = useState("");
  const [evidence, setEvidence] = useState("");
  const [overrideComment, setOverrideComment] = useState("");
  const [isCreatingNewSkill, setIsCreatingNewSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Programming");
  const [newSkillType, setNewSkillType] = useState("Technical");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
      if (initialSkill) {
        setSelectedSkillId(initialSkill.skillId || initialSkill.skill?.id || "");
        setSelfRating(initialSkill.selfRating ?? 0);
        setValidatedRating(initialSkill.validatedRating ?? 0);
        setYearsOfExperience(initialSkill.yearsOfExperience ?? 0);
        setLastUsed(initialSkill.lastUsed ? initialSkill.lastUsed.split("T")[0] : "");
        setEvidence(initialSkill.evidence || "");
        setOverrideComment(initialSkill.overrideComment || "");
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialSkill]);

  const resetForm = () => {
    setSelectedSkillId("");
    setSelfRating(0);
    setValidatedRating(3);
    setYearsOfExperience(1);
    setLastUsed(new Date().toISOString().split("T")[0]);
    setEvidence("");
    setOverrideComment("");
    setIsCreatingNewSkill(false);
    setError(null);
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/v1/skills");
      if (res.ok) {
        const data = await res.json();
        setAvailableSkills(data);
        if (!initialSkill && data.length > 0) {
          setSelectedSkillId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load skills", err);
    }
  };

  if (!isOpen) return null;

  const requiresOverrideComment =
    Math.abs(validatedRating - selfRating) >= 2 && selfRating > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requiresOverrideComment && (!overrideComment || !overrideComment.trim())) {
      setError("A mandatory comment is required when the validated rating differs by 2 or more levels from the self-rating (BRD §5.3.2).");
      return;
    }

    try {
      setSaving(true);
      let skillIdToSave = selectedSkillId;

      // Create skill on the fly if user chose to add new
      if (isCreatingNewSkill) {
        if (!newSkillName.trim()) {
          setError("Please enter a new skill name");
          setSaving(false);
          return;
        }

        const createRes = await fetch("/api/v1/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newSkillName.trim(),
            categoryName: newSkillCategory,
            type: newSkillType,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Failed to create new skill");
        }
        skillIdToSave = createData.skill.id;
      }

      if (!skillIdToSave) {
        setError("Please select or create a skill");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/v1/employees/${employeeId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skillIdToSave,
          selfRating,
          validatedRating,
          yearsOfExperience: Number(yearsOfExperience) || 0,
          lastUsed: lastUsed || null,
          evidence,
          overrideComment: requiresOverrideComment ? overrideComment.trim() : null,
          ratingSource: "MANAGER",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save skill rating");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-hgv-teal/10 text-hgv-teal flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-hgv-navy">
                {initialSkill ? "Update Skill Assessment" : "Add Skill Assessment"}
              </h3>
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

          {/* Skill Selection */}
          {!initialSkill && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Select Skill <span className="text-hgv-coral">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewSkill(!isCreatingNewSkill)}
                  className="text-[11px] text-hgv-teal font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {isCreatingNewSkill ? "Pick Existing" : "+ Add New Skill"}
                </button>
              </div>

              {isCreatingNewSkill ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">
                      New Skill Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Snowflake, Golang, GraphQL"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-hgv-teal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Category
                      </label>
                      <select
                        value={newSkillCategory}
                        onChange={(e) => setNewSkillCategory(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800"
                      >
                        <option value="Programming">Programming</option>
                        <option value="Cloud">Cloud & DevOps</option>
                        <option value="Data & AI">Data & AI</option>
                        <option value="Testing">Testing & QA</option>
                        <option value="Domain Knowledge">Domain Knowledge</option>
                        <option value="Soft Skills">Soft Skills</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Skill Type
                      </label>
                      <select
                        value={newSkillType}
                        onChange={(e) => setNewSkillType(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800"
                      >
                        <option value="Technical">Technical</option>
                        <option value="Functional">Functional</option>
                        <option value="Behavioural">Behavioural</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
                >
                  {availableSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category?.name || "General"} — {s.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Validated Rating (0 to 5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Manager / Lead Validated Rating (0–5) <span className="text-hgv-coral">*</span>
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {PROFICIENCY_LEVELS.map((p) => {
                const isSelected = validatedRating === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setValidatedRating(p.level)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all text-xs flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? "bg-hgv-navy text-white border-hgv-navy shadow-xs font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-sm">{p.level}</span>
                    <span className="text-[9px] truncate max-w-full opacity-80">
                      {p.label.split(" - ")[1]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              {PROFICIENCY_LEVELS[validatedRating]?.desc}
            </p>
          </div>

          {/* Self Rating (0 to 5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Employee Self-Rating (0–5)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {PROFICIENCY_LEVELS.map((p) => {
                const isSelected = selfRating === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setSelfRating(p.level)}
                    className={`py-1.5 px-1 text-center rounded-lg border transition-all text-xs flex flex-col items-center ${
                      isSelected
                        ? "bg-hgv-teal text-white border-hgv-teal font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>L{p.level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Override Comment (Mandatory if difference >= 2) */}
          {requiresOverrideComment && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
              <label className="block text-xs font-bold text-amber-900">
                Manager Override Justification <span className="text-hgv-coral">*</span>
              </label>
              <p className="text-[10px] text-amber-700">
                The validated rating (L{validatedRating}) differs by $\ge 2$ levels from self-rating (L{selfRating}). Please provide justification.
              </p>
              <textarea
                required
                rows={2}
                value={overrideComment}
                onChange={(e) => setOverrideComment(e.target.value)}
                placeholder="Observed client project delivery, lack of production experience..."
                className="w-full bg-white border border-amber-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Experience and Last Used */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Used (Date)
              </label>
              <input
                type="date"
                value={lastUsed}
                onChange={(e) => setLastUsed(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
              />
            </div>
          </div>

          {/* Evidence / Project Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence / Project Experience Note
            </label>
            <textarea
              rows={2}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="e.g. Led Azure Cloud Migration project, designed pipeline architecture..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-hgv-teal/40"
            />
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
              className="px-4 py-1.5 text-xs font-semibold text-white bg-hgv-teal hover:bg-hgv-teal/90 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : initialSkill ? "Update Rating" : "Save Skill Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
