"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Category = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  title: string;
  status: "pending" | "rejected";
  rejectionReason?: string;
  submittedAt: string;
};

type QuizSubmissionFormProps = {
  categories: Category[];
};

const sampleQuestions = [
  {
    prompt: "What does CSRF stand for?",
    options: [
      { label: "Cross-Site Request Forgery", isCorrect: true },
      { label: "Cross-Site Resource Format", isCorrect: false },
      { label: "Client-Side Request Filter", isCorrect: false },
      { label: "Cross-Server Routing Function", isCorrect: false },
    ],
  },
];

export function QuizSubmissionForm({ categories }: QuizSubmissionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [questionsJson, setQuestionsJson] = useState(
    JSON.stringify(sampleQuestions, null, 2),
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.name })),
    [categories],
  );

  async function loadSubmissions() {
    setIsLoadingSubmissions(true);
    setAuthNotice(null);
    try {
      const response = await fetch("/api/quizzes/submissions");
      if (!response.ok) {
        if (response.status === 401) {
          setAuthNotice("Sign in to view your submissions.");
        }
        setSubmissions([]);
        return;
      }
      const data = await response.json();
      setSubmissions(data.submissions ?? []);
    } catch {
      setSubmissions([]);
      setAuthNotice("Unable to load submissions.");
    } finally {
      setIsLoadingSubmissions(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      const parsed = JSON.parse(questionsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Questions JSON must be an array.");
      }

      for (const question of parsed) {
        if (!question.prompt || !Array.isArray(question.options)) {
          throw new Error("Each question needs a prompt and options array.");
        }
        if (question.options.length < 2) {
          throw new Error("Each question needs at least two options.");
        }
      }

      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          questions: parsed,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed.");
      }

      setStatus("Quiz submitted for review.");
      setTitle("");
      setDescription("");
      setQuestionsJson(JSON.stringify(sampleQuestions, null, 2));
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm text-white/70">
          Quiz title
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
          />
        </label>

        <label className="block text-sm text-white/70">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
          />
        </label>

        <label className="block text-sm text-white/70">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-cyber-bg">
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-white/70">
          Questions JSON
          <textarea
            value={questionsJson}
            onChange={(event) => setQuestionsJson(event.target.value)}
            className="mt-2 min-h-[240px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-cyber-cyan/60"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="rounded-xl border border-cyber-neon/40 bg-cyber-neon/10 px-4 py-3 text-sm text-cyber-neon">
            {status}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full border border-cyber-neon/50 bg-cyber-neon/10 px-6 py-3 text-sm font-semibold text-cyber-neon shadow-neon transition hover:bg-cyber-neon/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit for review"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold">My submissions</h2>
        {isLoadingSubmissions ? (
          <p className="mt-2 text-sm text-white/60">Loading submissions...</p>
        ) : authNotice ? (
          <p className="mt-2 text-sm text-white/60">{authNotice}</p>
        ) : submissions.length === 0 ? (
          <p className="mt-2 text-sm text-white/60">
            No submissions yet. Submit a quiz to see review status here.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{submission.title}</span>
                  <span
                    className={
                      submission.status === "pending"
                        ? "text-cyber-cyan"
                        : "text-cyber-magenta"
                    }
                  >
                    {submission.status}
                  </span>
                </div>
                {submission.rejectionReason ? (
                  <p className="mt-2 text-xs text-white/70">
                    {submission.rejectionReason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
