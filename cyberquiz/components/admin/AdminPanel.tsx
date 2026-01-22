"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  QuestionEditor,
  createDraftQuestion,
  type DraftQuestion,
} from "@/components/quiz/QuestionEditor";

type Category = {
  id: string;
  name: string;
  description: string;
};

type QuizSummary = {
  id: string;
  title: string;
  categoryId: string;
  questionsCount: number;
  createdAt: string;
};

type UserSummary = {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role: "user" | "admin";
  createdAt: string;
};

export function AdminPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizCategoryId, setQuizCategoryId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<DraftQuestion[]>([
    createDraftQuestion(),
  ]);
  const [quizStatus, setQuizStatus] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryStatus, setCategoryStatus] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  async function fetchJson(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Request failed.");
    }
    return response.json();
  }

  async function loadData() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [categoriesData, quizzesData, usersData] = await Promise.all([
        fetchJson("/api/admin/categories"),
        fetchJson("/api/admin/quizzes"),
        fetchJson("/api/admin/users"),
      ]);
      setCategories(categoriesData.categories ?? []);
      setQuizzes(quizzesData.quizzes ?? []);
      setUsers(usersData.users ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!quizCategoryId && categories.length > 0) {
      setQuizCategoryId(categories[0]?.id ?? "");
    }
  }, [categories, quizCategoryId]);

  async function handleCreateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuizError(null);
    setQuizStatus(null);
    setIsSavingQuiz(true);

    try {
      const payloadQuestions = quizQuestions.map((question) => ({
        prompt: question.prompt,
        options: question.options.map((option) => ({
          label: option.label,
          isCorrect: option.isCorrect,
        })),
      }));

      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          categoryId: quizCategoryId,
          questions: payloadQuestions,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Quiz creation failed.");
      }

      setQuizStatus("Quiz published.");
      setQuizTitle("");
      setQuizDescription("");
      setQuizQuestions([createDraftQuestion()]);
      await loadData();
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Quiz creation failed.");
    } finally {
      setIsSavingQuiz(false);
    }
  }

  async function handleDeleteQuiz(quizId: string) {
    setQuizError(null);
    setQuizStatus(null);
    if (!window.confirm("Delete this quiz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Quiz deletion failed.");
      }
      setQuizStatus("Quiz deleted.");
      await loadData();
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Quiz deletion failed.");
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError(null);
    setCategoryStatus(null);
    setIsSavingCategory(true);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Category creation failed.");
      }
      setCategoryStatus("Category added.");
      setCategoryName("");
      setCategoryDescription("");
      await loadData();
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Category creation failed.",
      );
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    setCategoryError(null);
    setCategoryStatus(null);
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Category deletion failed.");
      }
      setCategoryStatus("Category deleted.");
      await loadData();
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Category deletion failed.",
      );
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserError(null);
    setUserStatus(null);
    setIsSavingUser(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          username: userUsername,
          displayName: userDisplayName || undefined,
          password: userPassword,
          role: userRole,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "User creation failed.");
      }
      setUserStatus("User added.");
      setUserEmail("");
      setUserUsername("");
      setUserDisplayName("");
      setUserPassword("");
      setUserRole("user");
      await loadData();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "User creation failed.");
    } finally {
      setIsSavingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    setUserError(null);
    setUserStatus(null);
    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "User deletion failed.");
      }
      setUserStatus("User deleted.");
      await loadData();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "User deletion failed.");
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
        Loading admin data...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-8 text-sm text-red-200">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GlassPanel className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin control center</h1>
            <p className="mt-2 text-white/70">
              Publish quizzes, manage categories, and keep users in check.
            </p>
          </div>
          <Link
            href="/quizzes/pending"
            className="rounded-full border border-cyber-cyan/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon"
          >
            Review submissions
          </Link>
        </div>
      </GlassPanel>

      <GlassPanel className="p-8">
        <h2 className="text-xl font-semibold">Publish a quiz</h2>
        <p className="mt-2 text-sm text-white/70">
          Create a quiz directly as an admin. It will go live immediately.
        </p>
        <form onSubmit={handleCreateQuiz} className="mt-6 space-y-4">
          <label className="block text-sm text-white/70">
            Title
            <input
              type="text"
              required
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Description
            <textarea
              value={quizDescription}
              onChange={(event) => setQuizDescription(event.target.value)}
              className="mt-2 min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Category
            <select
              value={quizCategoryId}
              onChange={(event) => setQuizCategoryId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            >
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                  className="bg-cyber-bg"
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            <p className="text-sm text-white/70">Questions</p>
            <QuestionEditor value={quizQuestions} onChange={setQuizQuestions} />
          </div>

          {quizError ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {quizError}
            </p>
          ) : null}
          {quizStatus ? (
            <p className="rounded-xl border border-cyber-neon/40 bg-cyber-neon/10 px-4 py-3 text-sm text-cyber-neon">
              {quizStatus}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSavingQuiz}
            className="rounded-full border border-cyber-neon/50 bg-cyber-neon/10 px-6 py-3 text-sm font-semibold text-cyber-neon shadow-neon transition hover:bg-cyber-neon/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingQuiz ? "Publishing..." : "Publish quiz"}
          </button>
        </form>
      </GlassPanel>

      <GlassPanel className="p-8">
        <h2 className="text-xl font-semibold">Published quizzes</h2>
        <p className="mt-2 text-sm text-white/70">
          Remove any quiz instantly.
        </p>
        <div className="mt-6 space-y-3">
          {quizzes.length === 0 ? (
            <p className="text-sm text-white/60">No quizzes found.</p>
          ) : (
            quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{quiz.title}</p>
                  <p className="text-xs text-white/60">
                    {categoryMap.get(quiz.categoryId) ?? "General"} -{" "}
                    {quiz.questionsCount} questions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="text-xs uppercase tracking-[0.3em] text-cyber-magenta transition hover:text-white"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="p-8">
        <h2 className="text-xl font-semibold">Categories</h2>
        <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
          <label className="block text-sm text-white/70">
            Name
            <input
              type="text"
              required
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Description
            <input
              type="text"
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>

          {categoryError ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {categoryError}
            </p>
          ) : null}
          {categoryStatus ? (
            <p className="rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-3 text-sm text-cyber-cyan">
              {categoryStatus}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSavingCategory}
            className="rounded-full border border-cyber-cyan/50 px-6 py-3 text-sm font-semibold text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingCategory ? "Saving..." : "Add category"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-white/60">No categories yet.</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{category.name}</p>
                  <p className="text-xs text-white/60">{category.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-xs uppercase tracking-[0.3em] text-cyber-magenta transition hover:text-white"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="p-8">
        <h2 className="text-xl font-semibold">Users</h2>
        <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
          <label className="block text-sm text-white/70">
            Email
            <input
              type="email"
              required
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Username
            <input
              type="text"
              required
              value={userUsername}
              onChange={(event) => setUserUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Display name
            <input
              type="text"
              value={userDisplayName}
              onChange={(event) => setUserDisplayName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Password
            <input
              type="password"
              required
              value={userPassword}
              onChange={(event) => setUserPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>
          <label className="block text-sm text-white/70">
            Role
            <select
              value={userRole}
              onChange={(event) =>
                setUserRole(event.target.value === "admin" ? "admin" : "user")
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            >
              <option value="user" className="bg-cyber-bg">
                User
              </option>
              <option value="admin" className="bg-cyber-bg">
                Admin
              </option>
            </select>
          </label>

          {userError ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {userError}
            </p>
          ) : null}
          {userStatus ? (
            <p className="rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-3 text-sm text-cyber-cyan">
              {userStatus}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSavingUser}
            className="rounded-full border border-cyber-cyan/50 px-6 py-3 text-sm font-semibold text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingUser ? "Saving..." : "Add user"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-white/60">No users yet.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-white/60">
                    {user.email} - {user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-xs uppercase tracking-[0.3em] text-cyber-magenta transition hover:text-white"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
