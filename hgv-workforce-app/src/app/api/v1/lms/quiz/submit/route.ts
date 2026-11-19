import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeCertificateHash, generateCertificateNumber, logLmsAudit } from "@/lib/lms";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { quizId, enrollmentId, answers = {} } = body;

    if (!quizId || !enrollmentId) {
      return NextResponse.json({ error: "quizId and enrollmentId are required" }, { status: 400 });
    }

    const enrollment = await prisma.lmsEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const quiz = await prisma.lmsQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            options: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check existing attempts
    const previousAttempts = await prisma.lmsQuizAttempt.findMany({
      where: { quizId, enrollmentId },
      orderBy: { submittedAt: "desc" },
    });

    if (previousAttempts.length >= quiz.maxAttempts && !previousAttempts.some((a) => a.isPassed)) {
      // Check cooldown
      const lastAttempt = previousAttempts[0];
      const cooldownMs = quiz.cooldownHours * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(lastAttempt.submittedAt).getTime();
      if (elapsed < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsed) / (60 * 1000));
        return NextResponse.json(
          {
            error: `Maximum attempts (${quiz.maxAttempts}) reached. Mandatory cooldown active: please retry in ${remainingMinutes} minutes.`,
            isCooldownActive: true,
            remainingMinutes,
          },
          { status: 429 }
        );
      }
    }

    // Evaluate answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const reviewBreakdown = [];

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      let isQuestionCorrect = false;

      const correctOptions = q.options.filter((o) => o.isCorrect);

      if (q.type === "MCQ_MULTI") {
        const userSelected = Array.isArray(userAnswer) ? userAnswer : userAnswer ? [userAnswer] : [];
        const correctIds = correctOptions.map((o) => o.id);
        const allCorrectSelected =
          userSelected.length === correctIds.length &&
          userSelected.every((id: string) => correctIds.includes(id));
        isQuestionCorrect = allCorrectSelected;
      } else {
        // MCQ_SINGLE or TRUE_FALSE
        const correctOption = correctOptions[0];
        if (correctOption && userAnswer === correctOption.id) {
          isQuestionCorrect = true;
        }
      }

      if (isQuestionCorrect) {
        earnedPoints += q.points;
      }

      reviewBreakdown.push({
        questionId: q.id,
        questionText: q.questionText,
        type: q.type,
        isCorrect: isQuestionCorrect,
        userAnswer,
        correctAnswers: correctOptions.map((o) => ({ id: o.id, text: o.optionText })),
        explanation: q.explanation,
      });
    }

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = scorePercent >= quiz.passingThresholdPercent;
    const attemptNumber = previousAttempts.length + 1;

    // Record quiz attempt
    const attempt = await prisma.lmsQuizAttempt.create({
      data: {
        quizId,
        enrollmentId,
        userId: user.id,
        scorePercent,
        isPassed,
        attemptNumber,
        answersJson: JSON.stringify(answers),
      },
    });

    let certificate = null;

    if (isPassed) {
      // Mark enrollment as completed
      const now = new Date();
      await prisma.lmsEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "COMPLETED",
          progressPercent: 100,
          completedAt: now,
        },
      });

      // Generate or update certificate
      const certNumber = generateCertificateNumber(enrollment.course.slug);
      const validityDays = enrollment.course.recertificationDays > 0 ? enrollment.course.recertificationDays : 365;
      const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
      const verificationHash = computeCertificateHash(
        certNumber,
        enrollment.userEmail,
        enrollment.course.title,
        now
      );
      const qrPayload = `https://hgv.workforce/lms/verify/${certNumber}`;

      certificate = await prisma.lmsCertificate.upsert({
        where: { enrollmentId },
        create: {
          certificateNumber: certNumber,
          enrollmentId,
          userId: user.id,
          userEmail: enrollment.userEmail,
          userName: enrollment.userName,
          courseId: enrollment.courseId,
          issuedAt: now,
          expiresAt,
          scorePercent,
          verificationHash,
          qrPayload,
          status: "VALID",
        },
        update: {
          scorePercent,
          issuedAt: now,
          expiresAt,
          verificationHash,
          status: "VALID",
        },
      });

      await logLmsAudit({
        actorEmail: user.email,
        actorRole: user.roleCode,
        action: "CERTIFICATE_ISSUED",
        targetEntity: "CERTIFICATE",
        entityId: certificate.id,
        details: {
          certificateNumber: certificate.certificateNumber,
          courseTitle: enrollment.course.title,
          scorePercent,
          validityDays,
        },
      });
    }

    await logLmsAudit({
      actorEmail: user.email,
      actorRole: user.roleCode,
      action: "QUIZ_SUBMIT",
      targetEntity: "QUIZ",
      entityId: quizId,
      details: {
        courseTitle: enrollment.course.title,
        scorePercent,
        isPassed,
        attemptNumber,
      },
    });

    return NextResponse.json({
      success: true,
      scorePercent,
      isPassed,
      passingThresholdPercent: quiz.passingThresholdPercent,
      attemptNumber,
      certificate,
      reviewBreakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
