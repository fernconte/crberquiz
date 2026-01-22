import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Option = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  createdBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  questions: Question[];
};

export type PendingQuiz = Quiz & {
  status: "pending" | "rejected";
  submittedBy: string;
  submittedAt: string;
  rejectionReason?: string;
};

export type User = {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role: "user" | "admin";
  salt: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type LeaderboardEntry = {
  id: string;
  username: string;
  score: number;
};

export type Store = {
  categories: Category[];
  quizzes: Quiz[];
  pendingQuizzes: PendingQuiz[];
  users: User[];
  sessions: Session[];
  leaderboard: LeaderboardEntry[];
};

const storePath = path.join(process.cwd(), "data", "store.json");

async function readStore(): Promise<Store> {
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as Store;
}

async function writeStore(store: Store) {
  const json = JSON.stringify(store, null, 2);
  await fs.writeFile(storePath, `${json}\n`);
}

async function updateStore(
  mutator: (store: Store) => void,
): Promise<Store> {
  const store = await readStore();
  mutator(store);
  await writeStore(store);
  return store;
}

function hashPassword(password: string, salt: string) {
  const hash = crypto.createHash("sha256");
  hash.update(`${salt}:${password}`);
  return hash.digest("hex");
}

export async function getCategories() {
  const store = await readStore();
  return store.categories;
}

export async function getCategoryById(categoryId: string) {
  const store = await readStore();
  return store.categories.find((category) => category.id === categoryId);
}

export async function getQuizzes() {
  const store = await readStore();
  return store.quizzes;
}

export async function getQuizById(quizId: string) {
  const store = await readStore();
  return store.quizzes.find((quiz) => quiz.id === quizId);
}

export async function getLeaderboard() {
  const store = await readStore();
  return store.leaderboard;
}

export async function createUser(input: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  const password = input.password.trim();

  if (!email || !username || !password) {
    throw new Error("Missing fields.");
  }

  let createdUser: User | null = null;

  await updateStore((store) => {
    const emailExists = store.users.some((user) => user.email === email);
    const usernameExists = store.users.some((user) => user.username === username);
    if (emailExists || usernameExists) {
      throw new Error("User already exists.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const user: User = {
      id: `user-${crypto.randomUUID()}`,
      email,
      username,
      displayName: input.displayName?.trim() || username,
      role: "user",
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    createdUser = user;
    store.users.push(user);
  });

  if (!createdUser) {
    const store = await readStore();
    createdUser = store.users.find((user) => user.email === email) ?? null;
  }

  if (!createdUser) {
    throw new Error("User creation failed.");
  }

  return createdUser;
}

export async function verifyUser(input: {
  identifier: string;
  password: string;
}) {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password.trim();
  const store = await readStore();

  const user = store.users.find(
    (candidate) =>
      candidate.email === identifier ||
      candidate.username.toLowerCase() === identifier,
  );

  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const passwordHash = hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error("Invalid credentials.");
  }

  return user;
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

  await updateStore((store) => {
    store.sessions = store.sessions.filter(
      (session) => session.userId !== userId,
    );
    store.sessions.push({ token, userId, expiresAt });
  });

  return { token, expiresAt };
}

export async function removeSession(token: string) {
  await updateStore((store) => {
    store.sessions = store.sessions.filter((session) => session.token !== token);
  });
}

export async function getUserBySession(token?: string) {
  if (!token) {
    return null;
  }

  const store = await readStore();
  const session = store.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    await removeSession(token);
    return null;
  }

  const user = store.users.find((candidate) => candidate.id === session.userId);
  return user ?? null;
}

export async function submitQuiz(input: {
  title: string;
  description: string;
  categoryId: string;
  questions: Array<{
    prompt: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  }>;
  userId: string;
}) {
  const title = input.title.trim();
  const description = input.description.trim();
  const categoryId = input.categoryId.trim();
  const questions = input.questions;

  if (!title || !categoryId || questions.length === 0) {
    throw new Error("Missing quiz details.");
  }

  for (const question of questions) {
    if (!question.prompt.trim()) {
      throw new Error("Each question needs a prompt.");
    }
    if (!question.options || question.options.length < 2) {
      throw new Error("Each question needs at least two options.");
    }
    for (const option of question.options) {
      if (!option.label.trim()) {
        throw new Error("Each option needs a label.");
      }
    }
    const hasCorrect = question.options.some((option) => option.isCorrect);
    if (!hasCorrect) {
      throw new Error("Each question needs a correct option.");
    }
  }

  await updateStore((store) => {
    const pendingQuiz: PendingQuiz = {
      id: `pending-${crypto.randomUUID()}`,
      title,
      description,
      categoryId,
      createdBy: input.userId,
      createdAt: new Date().toISOString(),
      submittedBy: input.userId,
      submittedAt: new Date().toISOString(),
      status: "pending",
      questions: questions.map((question) => ({
        id: `q-${crypto.randomUUID()}`,
        prompt: question.prompt.trim(),
        options: question.options.map((option) => ({
          id: `opt-${crypto.randomUUID()}`,
          label: option.label.trim(),
          isCorrect: Boolean(option.isCorrect),
        })),
      })),
    };

    store.pendingQuizzes.push(pendingQuiz);
  });
}

export async function getUserSubmissions(userId: string) {
  const store = await readStore();
  return store.pendingQuizzes.filter(
    (quiz) => quiz.submittedBy === userId,
  );
}

export async function getPendingQuizzes() {
  const store = await readStore();
  return store.pendingQuizzes.filter((quiz) => quiz.status === "pending");
}

export async function updatePendingQuiz(input: {
  quizId: string;
  title: string;
  description: string;
  categoryId: string;
  questions: Question[];
}) {
  if (!input.title.trim() || !input.categoryId.trim()) {
    throw new Error("Title and category are required.");
  }
  if (input.questions.length === 0) {
    throw new Error("Questions are required.");
  }

  return updateStore((store) => {
    const quiz = store.pendingQuizzes.find((item) => item.id === input.quizId);
    if (!quiz) {
      throw new Error("Pending quiz not found.");
    }

    quiz.title = input.title.trim();
    quiz.description = input.description.trim();
    quiz.categoryId = input.categoryId.trim();
    quiz.questions = input.questions;
  });
}

export async function approvePendingQuiz(input: {
  quizId: string;
  adminId: string;
}) {
  return updateStore((store) => {
    const index = store.pendingQuizzes.findIndex(
      (quiz) => quiz.id === input.quizId,
    );
    if (index === -1) {
      throw new Error("Pending quiz not found.");
    }

    const [quiz] = store.pendingQuizzes.splice(index, 1);
    const { status, submittedAt, submittedBy, rejectionReason, ...baseQuiz } =
      quiz;
    const approvedQuiz: Quiz = {
      ...baseQuiz,
      reviewedBy: input.adminId,
      reviewedAt: new Date().toISOString(),
    };

    store.quizzes.push(approvedQuiz);
  });
}

export async function rejectPendingQuiz(input: {
  quizId: string;
  adminId: string;
  rejectionReason: string;
}) {
  return updateStore((store) => {
    const quiz = store.pendingQuizzes.find((item) => item.id === input.quizId);
    if (!quiz) {
      throw new Error("Pending quiz not found.");
    }

    quiz.status = "rejected";
    quiz.rejectionReason = input.rejectionReason.trim();
    quiz.reviewedBy = input.adminId;
    quiz.reviewedAt = new Date().toISOString();
  });
}
