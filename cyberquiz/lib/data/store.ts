import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_TITLE_LEN = 120;
const MAX_DESC_LEN = 500;
const MAX_QUESTION_COUNT = 20;
const MAX_OPTION_COUNT = 6;
const MAX_PROMPT_LEN = 240;
const MAX_OPTION_LEN = 140;
const MAX_USERNAME_LEN = 24;
const MAX_EMAIL_LEN = 120;
const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;
const MAX_CATEGORY_NAME_LEN = 40;
const MAX_CATEGORY_DESC_LEN = 160;
const MAX_REJECTION_LEN = 200;
const PASSWORD_KEYLEN = 64;

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
  passwordAlgo?: "sha256" | "scrypt";
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
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error("Storage file missing.");
    }
    if (err.code === "EACCES" || err.code === "EPERM") {
      throw new Error("Storage is not readable.");
    }
    throw error;
  }
}

async function writeStore(store: Store) {
  const json = JSON.stringify(store, null, 2);
  try {
    await fs.writeFile(storePath, `${json}\n`);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EACCES" || err.code === "EPERM" || err.code === "EROFS") {
      throw new Error("Storage is read-only.");
    }
    throw error;
  }
}

async function updateStore(
  mutator: (store: Store) => void,
): Promise<Store> {
  const store = await readStore();
  mutator(store);
  await writeStore(store);
  return store;
}

function requireText(value: string, field: string, maxLen: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }
  if (trimmed.length > maxLen) {
    throw new Error(`${field} is too long.`);
  }
  return trimmed;
}

function optionalText(value: string | undefined, maxLen: number) {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length > maxLen) {
    throw new Error("Value is too long.");
  }
  return trimmed;
}

function validateEmail(email: string) {
  if (email.length > MAX_EMAIL_LEN) {
    throw new Error("Email is too long.");
  }
  const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicPattern.test(email)) {
    throw new Error("Email is invalid.");
  }
}

function validateUsername(username: string) {
  if (username.length > MAX_USERNAME_LEN) {
    throw new Error("Username is too long.");
  }
  const pattern = /^[a-zA-Z0-9_.-]+$/;
  if (!pattern.test(username)) {
    throw new Error("Username can only use letters, numbers, ., - and _.");
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function hashPassword(
  password: string,
  salt: string,
  algo: "sha256" | "scrypt",
) {
  if (algo === "sha256") {
    const hash = crypto.createHash("sha256");
    hash.update(`${salt}:${password}`);
    return hash.digest("hex");
  }
  const derived = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return derived.toString("hex");
}

function normalizeQuestions(
  input: Array<{
    prompt: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  }>,
) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Questions are required.");
  }
  if (input.length > MAX_QUESTION_COUNT) {
    throw new Error("Too many questions.");
  }

  return input.map((question) => {
    const prompt = requireText(question.prompt ?? "", "Question prompt", MAX_PROMPT_LEN);
    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error("Each question needs at least two options.");
    }
    if (question.options.length > MAX_OPTION_COUNT) {
      throw new Error("Too many options in a question.");
    }

    const options = question.options.map((option) => ({
      id: `opt-${crypto.randomUUID()}`,
      label: requireText(option.label ?? "", "Option label", MAX_OPTION_LEN),
      isCorrect: Boolean(option.isCorrect),
    }));
    const correctCount = options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error("Each question needs exactly one correct option.");
    }

    return {
      id: `q-${crypto.randomUUID()}`,
      prompt,
      options,
    };
  });
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

export async function getUsers() {
  const store = await readStore();
  return store.users;
}

type CreateUserInput = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

type CreateUserInternalInput = CreateUserInput & {
  role: "user" | "admin";
};

async function createUserInternal(input: CreateUserInternalInput) {
  const email = requireText(input.email, "Email", MAX_EMAIL_LEN).toLowerCase();
  validateEmail(email);
  const username = requireText(input.username, "Username", MAX_USERNAME_LEN);
  validateUsername(username);
  const password = requireText(input.password, "Password", MAX_PASSWORD_LEN);
  if (password.length < MIN_PASSWORD_LEN) {
    throw new Error("Password must be at least 8 characters.");
  }
  const displayName =
    optionalText(input.displayName, MAX_USERNAME_LEN) ?? username;

  let createdUser: User | null = null;

  await updateStore((store) => {
    const emailExists = store.users.some((user) => user.email === email);
    const usernameExists = store.users.some(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
    if (emailExists || usernameExists) {
      throw new Error("User already exists.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt, "scrypt");
    const user: User = {
      id: `user-${crypto.randomUUID()}`,
      email,
      username,
      displayName,
      role: input.role,
      salt,
      passwordHash,
      passwordAlgo: "scrypt",
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

export async function createUser(input: CreateUserInput) {
  return createUserInternal({ ...input, role: "user" });
}

export async function createUserAsAdmin(
  input: CreateUserInput & { role?: "user" | "admin" },
) {
  return createUserInternal({ ...input, role: input.role ?? "user" });
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

  const algo = user.passwordAlgo ?? "sha256";
  const passwordHash = hashPassword(password, user.salt, algo);
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from(passwordHash, "hex");
  if (expected.length !== actual.length) {
    throw new Error("Invalid credentials.");
  }
  if (!crypto.timingSafeEqual(expected, actual)) {
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
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(input.categoryId, "Category", MAX_CATEGORY_NAME_LEN);
  const questions = normalizeQuestions(input.questions);

  await updateStore((store) => {
    const categoryExists = store.categories.some(
      (category) => category.id === categoryId,
    );
    if (!categoryExists) {
      throw new Error("Category not found.");
    }

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
      questions,
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
  questions: Array<{
    prompt: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  }>;
}) {
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(input.categoryId, "Category", MAX_CATEGORY_NAME_LEN);
  const questions = normalizeQuestions(input.questions);

  return updateStore((store) => {
    const quiz = store.pendingQuizzes.find((item) => item.id === input.quizId);
    if (!quiz) {
      throw new Error("Pending quiz not found.");
    }

    const categoryExists = store.categories.some(
      (category) => category.id === categoryId,
    );
    if (!categoryExists) {
      throw new Error("Category not found.");
    }

    quiz.title = title;
    quiz.description = description;
    quiz.categoryId = categoryId;
    quiz.questions = questions;
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
    quiz.rejectionReason = requireText(
      input.rejectionReason ?? "",
      "Rejection reason",
      MAX_REJECTION_LEN,
    );
    quiz.reviewedBy = input.adminId;
    quiz.reviewedAt = new Date().toISOString();
  });
}

export async function createCategory(input: {
  name: string;
  description?: string;
}) {
  const name = requireText(input.name, "Category name", MAX_CATEGORY_NAME_LEN);
  const description =
    optionalText(input.description, MAX_CATEGORY_DESC_LEN) ?? "";
  const slug = slugify(name);
  if (!slug) {
    throw new Error("Category name is invalid.");
  }

  let created: Category | null = null;

  await updateStore((store) => {
    const exists = store.categories.some(
      (category) => category.id === slug || category.slug === slug,
    );
    if (exists) {
      throw new Error("Category already exists.");
    }

    const category: Category = {
      id: slug,
      name,
      slug,
      description,
    };
    created = category;
    store.categories.push(category);
  });

  if (!created) {
    throw new Error("Category creation failed.");
  }

  return created;
}

export async function deleteCategory(categoryId: string) {
  const id = requireText(categoryId, "Category", MAX_CATEGORY_NAME_LEN);

  return updateStore((store) => {
    const category = store.categories.find((item) => item.id === id);
    if (!category) {
      throw new Error("Category not found.");
    }
    const usedInQuizzes = store.quizzes.some(
      (quiz) => quiz.categoryId === id,
    );
    const usedInPending = store.pendingQuizzes.some(
      (quiz) => quiz.categoryId === id,
    );
    if (usedInQuizzes || usedInPending) {
      throw new Error("Category is in use.");
    }

    store.categories = store.categories.filter((item) => item.id !== id);
  });
}

export async function createQuizAsAdmin(input: {
  title: string;
  description: string;
  categoryId: string;
  questions: Array<{
    prompt: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  }>;
  adminId: string;
}) {
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(input.categoryId, "Category", MAX_CATEGORY_NAME_LEN);
  const questions = normalizeQuestions(input.questions);

  let created: Quiz | null = null;

  await updateStore((store) => {
    const categoryExists = store.categories.some(
      (category) => category.id === categoryId,
    );
    if (!categoryExists) {
      throw new Error("Category not found.");
    }

    const quiz: Quiz = {
      id: `quiz-${crypto.randomUUID()}`,
      title,
      description,
      categoryId,
      createdBy: input.adminId,
      createdAt: new Date().toISOString(),
      reviewedBy: input.adminId,
      reviewedAt: new Date().toISOString(),
      questions,
    };
    created = quiz;
    store.quizzes.push(quiz);
  });

  if (!created) {
    throw new Error("Quiz creation failed.");
  }

  return created;
}

export async function deleteQuiz(quizId: string) {
  const id = requireText(quizId, "Quiz", 64);
  return updateStore((store) => {
    const exists = store.quizzes.some((quiz) => quiz.id === id);
    if (!exists) {
      throw new Error("Quiz not found.");
    }
    store.quizzes = store.quizzes.filter((quiz) => quiz.id !== id);
  });
}

export async function deleteUser(input: {
  userId: string;
  requesterId: string;
}) {
  const userId = requireText(input.userId, "User", 64);
  const requesterId = requireText(input.requesterId, "Requester", 64);

  return updateStore((store) => {
    const user = store.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (userId === requesterId) {
      throw new Error("You cannot delete your own account.");
    }
    if (user.role === "admin") {
      const adminCount = store.users.filter(
        (candidate) => candidate.role === "admin",
      ).length;
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last admin.");
      }
    }

    store.users = store.users.filter((item) => item.id !== userId);
    store.sessions = store.sessions.filter(
      (session) => session.userId !== userId,
    );
    store.pendingQuizzes = store.pendingQuizzes.filter(
      (quiz) => quiz.submittedBy !== userId,
    );
    store.leaderboard = store.leaderboard.filter((entry) => entry.id !== userId);
  });
}
