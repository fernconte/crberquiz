"use client";

import { useEffect, useMemo, useState } from "react";
import {
  QuestionEditor,
  createDraftQuestion,
  type DraftQuestion,
} from "@/components/quiz/QuestionEditor";

type Category = {
  id: string;
  name: string;
};

type PendingQuiz = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  submittedAt: string;
  createdBy: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }>;
  rejectionReason?: string;
};

type PendingDraft = PendingQuiz & {
  draftQuestions: DraftQuestion[];
  rejectionReasonDraft: string;
};

type PendingReviewProps = {
  categories: Category[];
};

export function PendingReview({ categories }: PendingReviewProps) {
  const [items, setItems] = useState<PendingDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.name })),
    [categories],
  );

  async function loadPending() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/pending");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load pending quizzes.");
      }
      const data = await response.json();
      const pending = (data.pending ?? []) as PendingQuiz[];
      setItems(
        pending.map((quiz) => ({
          ...quiz,
          draftQuestions:
            quiz.questions.length > 0
              ? quiz.questions.map((question) => ({
                  id: question.id,
                  prompt: question.prompt,
                  options: question.options.map((option) => ({
                    id: option.id,
                    label: option.label,
                    isCorrect: option.isCorrect,
                  })),
                }))
              : [createDraftQuestion()],
          rejectionReasonDraft: quiz.rejectionReason ?? "",
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleSave(quiz: PendingDraft) {
    setError(null);
    try {
      const questions = quiz.draftQuestions.map((question) => ({
        prompt: question.prompt,
        options: question.options.map((option) => ({
          label: option.label,
          isCorrect: option.isCorrect,
        })),
      }));
      const response = await fetch(`/api/admin/pending/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          categoryId: quiz.categoryId,
          questions,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Update failed.");
      }
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function handleApprove(quizId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/pending/${quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Approve failed.");
      }
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.");
    }
  }

  async function handleReject(quiz: PendingDraft) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/pending/${quiz.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: quiz.rejectionReasonDraft,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Reject failed.");
      }
      await loadPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed.");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-white/70">Loading pending quizzes...</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-white/70">No pending quizzes.</p>;
  }

  return (
    <div className="space-y-8">
      {items.map((quiz, index) => (
        <div
          key={quiz.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {index + 1}. {quiz.title}
            </h2>
            <span className="text-xs text-white/50">ID: {quiz.id}</span>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="block text-xs text-white/60">
              Title
              <input
                type="text"
                value={quiz.title}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === quiz.id
                        ? { ...item, title: event.target.value }
                        : item,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
              />
            </label>

            <label className="block text-xs text-white/60">
              Description
              <textarea
                value={quiz.description}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === quiz.id
                        ? { ...item, description: event.target.value }
                        : item,
                    ),
                  )
                }
                className="mt-2 min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
              />
            </label>

            <label className="block text-xs text-white/60">
              Category
              <select
                value={quiz.categoryId}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === quiz.id
                        ? { ...item, categoryId: event.target.value }
                        : item,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
              >
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id} className="bg-cyber-bg">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Questions
              </p>
              <QuestionEditor
                value={quiz.draftQuestions}
                onChange={(nextQuestions) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === quiz.id
                        ? { ...item, draftQuestions: nextQuestions }
                        : item,
                    ),
                  )
                }
              />
            </div>

            <label className="block text-xs text-white/60">
              Rejection reason
              <input
                type="text"
                value={quiz.rejectionReasonDraft}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.id === quiz.id
                        ? { ...item, rejectionReasonDraft: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Required if rejecting"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleSave(quiz)}
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-cyber-cyan/60 hover:text-cyber-cyan"
            >
              Save edits
            </button>
            <button
              type="button"
              onClick={() => handleApprove(quiz.id)}
              className="rounded-full border border-cyber-neon/50 bg-cyber-neon/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyber-neon shadow-neon transition hover:bg-cyber-neon/20"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleReject(quiz)}
              className="rounded-full border border-cyber-magenta/50 bg-cyber-magenta/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyber-magenta transition hover:bg-cyber-magenta/20"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
