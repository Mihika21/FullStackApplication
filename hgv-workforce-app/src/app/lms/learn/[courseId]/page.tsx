"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { downloadCertificatePdf } from "@/lib/certificatePdf";
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  FileText,
  Presentation,
  Award,
  Clock,
  Shield,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Download,
  Lock,
  Unlock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function CoursePlayerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params.courseId as string;
  const enrollmentIdParam = searchParams.get("enrollmentId");

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(true);

  // Video state
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [maxWatchTime, setMaxWatchTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Slides state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    fetchCourseAndEnrollment();
  }, [courseId, enrollmentIdParam]);

  const fetchCourseAndEnrollment = async () => {
    try {
      setLoading(true);
      // Fetch course details
      const cRes = await fetch(`/api/v1/lms/courses/${courseId}`);
      if (!cRes.ok) throw new Error("Failed to load course");
      const cData = await cRes.json();
      setCourse(cData.course);

      // Fetch or locate enrollment
      let enr = null;
      if (enrollmentIdParam) {
        const enrRes = await fetch(`/api/v1/lms/enrollments?scope=mine`);
        if (enrRes.ok) {
          const eData = await enrRes.json();
          enr = eData.enrollments.find((e: any) => e.id === enrollmentIdParam);
        }
      } else {
        const enrRes = await fetch(`/api/v1/lms/enrollments?scope=mine&courseId=${cData.course.id}`);
        if (enrRes.ok) {
          const eData = await enrRes.json();
          enr = eData.enrollments[0];
        }
      }

      setEnrollment(enr);

      // Select first lesson or resume where left off
      const firstModule = cData.course.modules?.[0];
      const allLessons = cData.course.modules?.flatMap((m: any) => m.lessons) || [];

      if (enr?.currentLessonId && allLessons.some((l: any) => l.id === enr.currentLessonId)) {
        setSelectedLessonId(enr.currentLessonId);
      } else if (allLessons.length > 0) {
        setSelectedLessonId(allLessons[0].id);
      } else if (firstModule?.quiz) {
        setShowQuiz(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Find currently active lesson
  const allLessons = course?.modules?.flatMap((m: any) => m.lessons) || [];
  const currentLesson = allLessons.find((l: any) => l.id === selectedLessonId);
  const currentModule = course?.modules?.find((m: any) =>
    m.lessons.some((l: any) => l.id === selectedLessonId)
  ) || course?.modules?.[0];
  const activeQuiz = currentModule?.quiz || course?.modules?.[0]?.quiz;

  // Track lesson progress
  const isLessonCompleted = (lessonId: string) => {
    return enrollment?.lessonProgress?.some(
      (p: any) => p.lessonId === lessonId && p.completed
    );
  };

  const handleMarkLessonComplete = async () => {
    if (!currentLesson || !enrollment) return;

    try {
      const res = await fetch("/api/v1/lms/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          lessonId: currentLesson.id,
          secondsWatched: currentLesson.durationSec || 180,
          completed: true,
        }),
      });

      if (res.ok) {
        // Refresh enrollment data
        const enrRes = await fetch(`/api/v1/lms/enrollments?scope=mine`);
        if (enrRes.ok) {
          const eData = await enrRes.json();
          const updatedEnr = eData.enrollments.find((e: any) => e.id === enrollment.id);
          setEnrollment(updatedEnr);
        }

        // Navigate to next lesson or quiz
        const currentIdx = allLessons.findIndex((l: any) => l.id === currentLesson.id);
        if (currentIdx < allLessons.length - 1) {
          setSelectedLessonId(allLessons[currentIdx + 1].id);
          setShowQuiz(false);
          setCurrentSlideIndex(0);
        } else if (activeQuiz) {
          setShowQuiz(true);
        }
      }
    } catch (err) {
      console.error("Failed to mark lesson complete:", err);
    }
  };

  // Video time update handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = Math.floor(videoRef.current.currentTime);
      setVideoSeconds(current);

      if (course?.enforceVideoCompletion) {
        if (current > maxWatchTime + 2) {
          // Prevent skipping forward
          videoRef.current.currentTime = maxWatchTime;
        } else if (current > maxWatchTime) {
          setMaxWatchTime(current);
        }
      }
    }
  };

  const handleVideoEnded = () => {
    handleMarkLessonComplete();
  };

  // Quiz submission
  const handleQuizSubmit = async () => {
    if (!activeQuiz || !enrollment) return;

    try {
      setQuizSubmitting(true);
      const res = await fetch("/api/v1/lms/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          enrollmentId: enrollment.id,
          answers: quizAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit assessment");
        return;
      }

      setQuizResult(data);

      if (data.isPassed) {
        // Refresh enrollment
        const enrRes = await fetch(`/api/v1/lms/enrollments?scope=mine`);
        if (enrRes.ok) {
          const eData = await enrRes.json();
          const updatedEnr = eData.enrollments.find((e: any) => e.id === enrollment.id);
          setEnrollment(updatedEnr);
        }
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading Learning Player...</span>
        </div>
      </div>
    );
  }

  // Sample slides for PDF/Slides mode
  const sampleSlides = [
    {
      title: "Slide 1: Executive Overview & Governance Standards",
      body: "Enterprise regulatory compliance requires adherence to AICPA SOC 2 Type II criteria and ISO/IEC 27001:2022 standards. Every workforce member represents a perimeter defense checkpoint.",
      bullets: ["Zero-Trust architecture across all endpoints", "Mandatory out-of-band identity validation", "72-hour statutory breach reporting SLA"],
    },
    {
      title: "Slide 2: Threat Matrix & Attack Vectors",
      body: "91% of modern enterprise cyber attacks initiate through sophisticated social engineering, credential phishing, or executive impersonation.",
      bullets: ["Executive wire transfer lures", "MFA fatigue attacks via continuous push requests", "Spoofed domain envelopes with valid SSL certs"],
    },
    {
      title: "Slide 3: Defensive Protocol & Incident Triage",
      body: "Immediate actions upon detecting suspicious activity ensure that Security Operations Center (SOC) personnel can isolate telemetry before lateral movement.",
      bullets: ["Disconnect network adapter immediately (do not power off)", "Alert Security SOC at security-incident@hgv.com", "Preserve memory dump for forensic analysis"],
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col bg-slate-900 text-slate-100 select-none min-h-[calc(100vh-8rem)]">
      {/* Player Header Bar */}
      <header className="h-14 bg-slate-950 border-b border-white/10 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/lms"
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 text-hgv-teal" />
            <span>Learner Portal</span>
          </Link>
          <div className="h-4 w-px bg-white/15" />
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide truncate max-w-md">
              {course.title}
            </h1>
            <p className="text-[10px] text-slate-400">
              {course.category} • Passing Score: {course.passingScore}%
            </p>
          </div>
        </div>

        {/* Progress & Status */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Overall Progress</span>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-hgv-teal transition-all duration-300"
                style={{ width: `${enrollment?.progressPercent || 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-hgv-teal">
              {enrollment?.progressPercent || 0}%
            </span>
          </div>

          {enrollment?.status === "COMPLETED" && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certified</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigator Sidebar */}
        <aside className="w-80 bg-slate-950/80 border-r border-white/10 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Curriculum Modules
            </h2>
          </div>

          <div className="p-3 space-y-4 flex-1">
            {course.modules?.map((module: any, mIdx: number) => (
              <div key={module.id} className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{module.title}</span>
                </div>

                <div className="space-y-1">
                  {module.lessons?.map((les: any) => {
                    const isSelected = selectedLessonId === les.id && !showQuiz;
                    const completed = isLessonCompleted(les.id);

                    const Icon =
                      les.contentType === "VIDEO"
                        ? PlayCircle
                        : les.contentType === "PDF"
                        ? Presentation
                        : FileText;

                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          setSelectedLessonId(les.id);
                          setShowQuiz(false);
                          setCurrentSlideIndex(0);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? "bg-hgv-teal text-white shadow-xs font-semibold"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          <span className="truncate">{les.title}</span>
                        </div>

                        {completed && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {/* End-of-Module Assessment / Quiz Entry */}
                  {module.quiz && (
                    <button
                      onClick={() => {
                        setShowQuiz(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between gap-2.5 mt-2 ${
                        showQuiz
                          ? "bg-amber-600 text-white shadow-xs font-semibold"
                          : "text-amber-300/90 hover:text-white hover:bg-amber-500/10 border border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Award className={`w-4 h-4 shrink-0 ${showQuiz ? "text-white" : "text-amber-400"}`} />
                        <span className="truncate">{module.quiz.title}</span>
                      </div>

                      {enrollment?.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300">
                          {module.quiz.passingThresholdPercent}% Pass
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Recertification & Compliance Footer */}
          <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 bg-white/5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <Shield className="w-3.5 h-3.5 text-hgv-teal" />
              <span>Compliance Guardrail</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {course.isMandatory
                ? `Mandatory training. Auto-recertification cycles every ${course.recertificationDays} days.`
                : "Elective professional development course."}
            </p>
          </div>
        </aside>

        {/* Center Learning Player / Quiz Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-900 flex flex-col">
          {showQuiz && activeQuiz ? (
            // ==========================================
            // ASSESSMENT / QUIZ ENGINE (FR-QUIZ)
            // ==========================================
            <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
              {/* Quiz Header */}
              <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Mandatory Final Assessment
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1.5">{activeQuiz.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeQuiz.description || "Answer all questions. Achieve ≥ 80% to earn your verifiable compliance certificate."}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-hgv-teal">{activeQuiz.passingThresholdPercent}%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Passing Threshold</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Questions: {activeQuiz.questions?.length || 0}</span>
                  <span>Max Attempts: {activeQuiz.maxAttempts}</span>
                  <span>Cooldown: {activeQuiz.cooldownHours}h between attempts</span>
                </div>
              </div>

              {/* Celebration / Passed Certificate Screen */}
              {quizResult?.isPassed && (
                <div className="bg-linear-to-r from-teal-950 via-slate-950 to-emerald-950 border border-teal-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg">
                        <Award className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">Congratulations! Certification Passed</h3>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-bold">
                            Score: {quizResult.scorePercent}%
                          </span>
                        </div>
                        <p className="text-xs text-teal-200 mt-0.5">
                          You have satisfied all mandatory compliance standards. Your official digital certificate has been issued and hashed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {quizResult.certificate && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Certificate No: <span className="text-hgv-teal font-mono">{quizResult.certificate.certificateNumber}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono truncate max-w-md">
                          SHA-256: {quizResult.certificate.verificationHash}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            downloadCertificatePdf({
                              certificateNumber: quizResult.certificate.certificateNumber,
                              recipientName: enrollment.userName,
                              recipientEmail: enrollment.userEmail,
                              courseTitle: course.title,
                              courseCategory: course.category,
                              issuedAt: quizResult.certificate.issuedAt,
                              expiresAt: quizResult.certificate.expiresAt,
                              scorePercent: quizResult.scorePercent,
                              verificationHash: quizResult.certificate.verificationHash,
                            })
                          }
                          className="px-4 py-2 bg-hgv-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>

                        <Link
                          href={`/lms/verify?query=${quizResult.certificate.certificateNumber}`}
                          target="_blank"
                          className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-hgv-teal" />
                          <span>Verify</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Failed Remediation Alert */}
              {quizResult && !quizResult.isPassed && (
                <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-6 shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span>Assessment Not Passed (Score: {quizResult.scorePercent}%)</span>
                  </div>
                  <p className="text-xs text-rose-200">
                    You did not meet the required threshold of {activeQuiz.passingThresholdPercent}%. Review the remediation feedback below and re-study the relevant lessons before retrying.
                  </p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {activeQuiz.questions?.map((q: any, qIdx: number) => {
                  const reviewItem = quizResult?.reviewBreakdown?.find(
                    (r: any) => r.questionId === q.id
                  );

                  return (
                    <div
                      key={q.id}
                      className={`bg-slate-950 border rounded-2xl p-6 shadow-lg space-y-4 transition ${
                        reviewItem
                          ? reviewItem.isCorrect
                            ? "border-emerald-500/40 bg-emerald-950/10"
                            : "border-rose-500/40 bg-rose-950/10"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-white leading-relaxed">
                              {q.questionText}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {q.type === "MCQ_MULTI"
                                ? "Multiple Choice (Select all that apply)"
                                : q.type === "TRUE_FALSE"
                                ? "True or False"
                                : "Single Choice"}
                            </p>
                          </div>
                        </div>

                        {reviewItem && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                              reviewItem.isCorrect
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {reviewItem.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Correct
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" /> Incorrect
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-2 pt-2">
                        {q.options?.map((opt: any) => {
                          const isSelected =
                            q.type === "MCQ_MULTI"
                              ? Array.isArray(quizAnswers[q.id]) && quizAnswers[q.id].includes(opt.id)
                              : quizAnswers[q.id] === opt.id;

                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                if (quizResult?.isPassed) return; // Locked once passed
                                if (q.type === "MCQ_MULTI") {
                                  const current = Array.isArray(quizAnswers[q.id])
                                    ? [...quizAnswers[q.id]]
                                    : [];
                                  if (current.includes(opt.id)) {
                                    setQuizAnswers({
                                      ...quizAnswers,
                                      [q.id]: current.filter((id) => id !== opt.id),
                                    });
                                  } else {
                                    setQuizAnswers({
                                      ...quizAnswers,
                                      [q.id]: [...current, opt.id],
                                    });
                                  }
                                } else {
                                  setQuizAnswers({
                                    ...quizAnswers,
                                    [q.id]: opt.id,
                                  });
                                }
                              }}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                                isSelected
                                  ? "border-hgv-teal bg-hgv-teal/20 text-white font-semibold"
                                  : "border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300"
                              }`}
                            >
                              <span>{opt.optionText}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                                  isSelected
                                    ? "border-hgv-teal bg-hgv-teal"
                                    : "border-slate-500"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Remediation Note on Failure (FR-QUIZ-05) */}
                      {reviewItem && !reviewItem.isCorrect && q.explanation && (
                        <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                          <p className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Remediation Guidance:</span>
                          </p>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setShowQuiz(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition"
                >
                  Return to Lessons
                </button>

                <button
                  onClick={handleQuizSubmit}
                  disabled={quizSubmitting || quizResult?.isPassed}
                  className="px-6 py-2.5 bg-hgv-teal hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {quizSubmitting
                      ? "Grading..."
                      : quizResult?.isPassed
                      ? "Passed & Certified"
                      : "Submit Final Assessment"}
                  </span>
                </button>
              </div>
            </div>
          ) : currentLesson ? (
            // ==========================================
            // MULTI-FORMAT LEARNING PLAYER (FR-CMS-02)
            // ==========================================
            <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                    {currentLesson.contentType} LESSON
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{currentLesson.title}</h2>
                </div>

                <div className="flex items-center gap-3">
                  {course.enforceVideoCompletion && currentLesson.contentType === "VIDEO" && (
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Compliance Fast-Forward Lock Active</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Content Formats */}
              {currentLesson.contentType === "VIDEO" ? (
                <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video flex flex-col justify-center relative">
                  <video
                    ref={videoRef}
                    src={currentLesson.contentUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                    controls
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : currentLesson.contentType === "PDF" ? (
                // PDF / Slide Deck Viewer
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-hgv-teal" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Slide Deck Presentation
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Slide {currentSlideIndex + 1} of {sampleSlides.length}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-white/5 rounded-xl p-8 min-h-[260px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-teal-300">
                        {sampleSlides[currentSlideIndex].title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {sampleSlides[currentSlideIndex].body}
                      </p>

                      <ul className="mt-4 space-y-2">
                        {sampleSlides[currentSlideIndex].bullets.map((b, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-hgv-teal shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                      <button
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-medium transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous Slide</span>
                      </button>

                      <button
                        onClick={() =>
                          setCurrentSlideIndex(Math.min(sampleSlides.length - 1, currentSlideIndex + 1))
                        }
                        disabled={currentSlideIndex === sampleSlides.length - 1}
                        className="px-3 py-1.5 rounded-lg bg-hgv-teal hover:bg-teal-600 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Next Slide</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Text / Markdown Reader
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-8 shadow-2xl space-y-4">
                  <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {currentLesson.textContent || "No text content provided."}
                  </div>
                </div>
              )}

              {/* Lesson Takeaways / Notes */}
              {currentLesson.textContent && currentLesson.contentType === "VIDEO" && (
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl space-y-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-hgv-teal" />
                    <span>Lesson Notes & Policy Reference</span>
                  </h3>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                    {currentLesson.textContent}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                <button
                  onClick={() => {
                    const currentIdx = allLessons.findIndex((l: any) => l.id === currentLesson.id);
                    if (currentIdx > 0) {
                      setSelectedLessonId(allLessons[currentIdx - 1].id);
                      setCurrentSlideIndex(0);
                    }
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleMarkLessonComplete}
                  className="px-6 py-2.5 bg-hgv-teal hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
                >
                  <span>Mark Complete & Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select a lesson from the curriculum sidebar to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CoursePlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
          Loading Learning Player...
        </div>
      }
    >
      <CoursePlayerContent />
    </Suspense>
  );
}
