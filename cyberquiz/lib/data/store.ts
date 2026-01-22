import crypto from "crypto";
import { getSql } from "@/lib/db";

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
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

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

type NormalizedQuestion = {
  prompt: string;
  options: Array<{ label: string; isCorrect: boolean }>;
};

type QuizRow = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  created_by: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
};

type QuestionRow = {
  id: string;
  quiz_id: string;
  prompt: string;
  position: number;
};

type OptionRow = {
  id: string;
  question_id: string;
  label: string;
  is_correct: boolean;
  position: number;
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: "user" | "admin";
  created_at: string;
  salt: string;
  password_hash: string;
  password_algo: string;
};

type UserSessionRow = UserRow & {
  expires_at: string;
};

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

function hashPassword(password: string, salt: string) {
  const derived = crypto.scryptSync(password, salt, PASSWORD_KEYLEN);
  return derived.toString("hex");
}

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeQuestions(input: NormalizedQuestion[]) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("Questions are required.");
  }
  if (input.length > MAX_QUESTION_COUNT) {
    throw new Error("Too many questions.");
  }

  return input.map((question) => {
    const prompt = requireText(
      question.prompt ?? "",
      "Question prompt",
      MAX_PROMPT_LEN,
    );
    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error("Each question needs at least two options.");
    }
    if (question.options.length > MAX_OPTION_COUNT) {
      throw new Error("Too many options in a question.");
    }

    const options = question.options.map((option) => ({
      label: requireText(option.label ?? "", "Option label", MAX_OPTION_LEN),
      isCorrect: Boolean(option.isCorrect),
    }));
    const correctCount = options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      throw new Error("Each question needs exactly one correct option.");
    }

    return {
      prompt,
      options,
    };
  });
}

function mapUserRow(row: UserRow | UserSessionRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name ?? undefined,
    role: row.role,
    createdAt: row.created_at,
  };
}

type SqlClient = ReturnType<typeof getSql>;

async function withTransaction<T>(fn: (tx: SqlClient) => Promise<T>) {
  const sql = getSql() as SqlClient & {
    transaction?: (handler: (tx: SqlClient) => Promise<T>) => Promise<T>;
    begin?: (handler: (tx: SqlClient) => Promise<T>) => Promise<T>;
  };

  if (typeof sql.transaction === "function") {
    return sql.transaction(fn);
  }
  if (typeof sql.begin === "function") {
    return sql.begin(fn);
  }
  return fn(sql);
}

async function loadQuestionsByQuizIds(quizIds: string[]) {
  const sql = getSql();
  if (quizIds.length === 0) {
    return new Map<string, Question[]>();
  }

  const questionRows = (await sql`
    select id, quiz_id, prompt, position
    from questions
    where quiz_id::text = any(${quizIds})
    order by quiz_id, position
  `) as QuestionRow[];

  const questionIds = questionRows.map((row) => row.id);
  const optionRows = questionIds.length
    ? ((await sql`
        select id, question_id, label, is_correct, position
        from options
        where question_id::text = any(${questionIds})
        order by question_id, position
      `) as OptionRow[])
    : [];

  const optionsByQuestion = new Map<string, Option[]>();
  for (const option of optionRows) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push({
      id: option.id,
      label: option.label,
      isCorrect: option.is_correct,
    });
    optionsByQuestion.set(option.question_id, list);
  }

  const questionsByQuiz = new Map<string, Question[]>();
  for (const question of questionRows) {
    const list = questionsByQuiz.get(question.quiz_id) ?? [];
    list.push({
      id: question.id,
      prompt: question.prompt,
      options: optionsByQuestion.get(question.id) ?? [],
    });
    questionsByQuiz.set(question.quiz_id, list);
  }

  return questionsByQuiz;
}

async function hydrateQuizzes(rows: QuizRow[]): Promise<Quiz[]> {
  const questionsByQuiz = await loadQuestionsByQuizIds(
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    questions: questionsByQuiz.get(row.id) ?? [],
  }));
}

async function hydratePendingQuizzes(rows: QuizRow[]): Promise<PendingQuiz[]> {
  const questionsByQuiz = await loadQuestionsByQuizIds(
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    questions: questionsByQuiz.get(row.id) ?? [],
    status: row.status === "rejected" ? "rejected" : "pending",
    submittedBy: row.created_by,
    submittedAt: row.created_at,
    rejectionReason: row.rejection_reason ?? undefined,
  }));
}

export async function getCategories(): Promise<Category[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, name, slug, description
    from categories
    order by name
  `) as Category[];
  return rows;
}

export async function getCategoryById(
  categoryId: string,
): Promise<Category | undefined> {
  const sql = getSql();
  const rows = (await sql`
    select id, name, slug, description
    from categories
    where id = ${categoryId}
    limit 1
  `) as Category[];
  return rows[0];
}

export async function getQuizzes(): Promise<Quiz[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, title, description, category_id, created_by, created_at,
           reviewed_by, reviewed_at, status, rejection_reason
    from quizzes
    where status = 'approved'
    order by created_at desc
  `) as QuizRow[];

  return hydrateQuizzes(rows);
}

export async function getQuizById(quizId: string): Promise<Quiz | undefined> {
  const sql = getSql();
  const rows = (await sql`
    select id, title, description, category_id, created_by, created_at,
           reviewed_by, reviewed_at, status, rejection_reason
    from quizzes
    where id = ${quizId} and status = 'approved'
    limit 1
  `) as QuizRow[];

  if (rows.length === 0) {
    return undefined;
  }

  const [quiz] = await hydrateQuizzes(rows);
  return quiz;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const sql = getSql();
  const rows = (await sql`
    select u.id, u.username, l.score
    from leaderboard_entries l
    join users u on u.id = l.user_id
    order by l.score desc
    limit 25
  `) as LeaderboardEntry[];

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    score: Number(row.score),
  }));
}

export async function getUsers(): Promise<User[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, username, display_name, role, created_at,
           salt, password_hash, password_algo
    from users
    order by created_at desc
  `) as UserRow[];

  return rows.map((row) => mapUserRow(row));
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

async function createUserInternal(input: CreateUserInternalInput): Promise<User> {
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

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const sql = getSql();
  try {
    const rows = (await sql`
      insert into users (email, username, display_name, role, salt, password_hash, password_algo)
      values (${email}, ${username}, ${displayName}, ${input.role}, ${salt}, ${passwordHash}, 'scrypt')
      returning id, email, username, display_name, role, created_at, salt, password_hash, password_algo
    `) as UserRow[];

    if (!rows[0]) {
      throw new Error("User creation failed.");
    }

    return mapUserRow(rows[0]);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      throw new Error("User already exists.");
    }
    throw error;
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  return createUserInternal({ ...input, role: "user" });
}

export async function createUserAsAdmin(
  input: CreateUserInput & { role?: "user" | "admin" },
): Promise<User> {
  return createUserInternal({ ...input, role: input.role ?? "user" });
}

export async function verifyUser(input: {
  identifier: string;
  password: string;
}): Promise<User> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password.trim();

  if (!identifier || !password) {
    throw new Error("Invalid credentials.");
  }

  const sql = getSql();
  const rows = (await sql`
    select id, email, username, display_name, role, created_at,
           salt, password_hash, password_algo
    from users
    where lower(email) = ${identifier} or lower(username) = ${identifier}
    limit 1
  `) as UserRow[];

  const user = rows[0];
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  const algo = user.password_algo ?? "scrypt";
  if (algo !== "scrypt") {
    throw new Error("Invalid credentials.");
  }

  const passwordHash = hashPassword(password, user.salt);
  const expected = Buffer.from(user.password_hash, "hex");
  const actual = Buffer.from(passwordHash, "hex");
  if (expected.length !== actual.length) {
    throw new Error("Invalid credentials.");
  }
  if (!crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Invalid credentials.");
  }

  return mapUserRow(user);
}

export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = crypto.randomUUID();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  const sql = getSql();
  await sql`
    delete from sessions where user_id = ${userId}
  `;

  await sql`
    insert into sessions (token_hash, user_id, expires_at)
    values (${tokenHash}, ${userId}, ${expiresAt.toISOString()})
  `;

  return { token, expiresAt: expiresAt.getTime() };
}

export async function removeSession(token: string) {
  const tokenHash = hashSessionToken(token);
  const sql = getSql();
  await sql`
    delete from sessions where token_hash = ${tokenHash}
  `;
}

export async function getUserBySession(token?: string): Promise<User | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const sql = getSql();
  const rows = (await sql`
    select u.id, u.email, u.username, u.display_name, u.role, u.created_at,
           u.salt, u.password_hash, u.password_algo, s.expires_at
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
    limit 1
  `) as UserSessionRow[];

  const row = rows[0];
  if (!row) {
    return null;
  }

  const expiresAt = Date.parse(row.expires_at);
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    await removeSession(token);
    return null;
  }

  return mapUserRow(row);
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
}): Promise<void> {
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(
    input.categoryId,
    "Category",
    MAX_CATEGORY_NAME_LEN,
  );
  const questions = normalizeQuestions(input.questions);

  const sql = getSql();
  const categoryExists = (await sql`
    select id from categories where id = ${categoryId} limit 1
  `) as Array<{ id: string }>;
  if (categoryExists.length === 0) {
    throw new Error("Category not found.");
  }

  await withTransaction(async (tx) => {
    const quizRows = (await tx`
      insert into quizzes (title, description, category_id, created_by, status)
      values (${title}, ${description}, ${categoryId}, ${input.userId}, 'pending')
      returning id
    `) as Array<{ id: string }>;

    const quizId = quizRows[0]?.id;
    if (!quizId) {
      throw new Error("Quiz creation failed.");
    }

    for (const [questionIndex, question] of questions.entries()) {
      const questionRows = (await tx`
        insert into questions (quiz_id, prompt, position)
        values (${quizId}, ${question.prompt}, ${questionIndex})
        returning id
      `) as Array<{ id: string }>;

      const questionId = questionRows[0]?.id;
      if (!questionId) {
        throw new Error("Question creation failed.");
      }

      for (const [optionIndex, option] of question.options.entries()) {
        await tx`
          insert into options (question_id, label, is_correct, position)
          values (${questionId}, ${option.label}, ${option.isCorrect}, ${optionIndex})
        `;
      }
    }
  });
}

export async function getUserSubmissions(
  userId: string,
): Promise<PendingQuiz[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, title, description, category_id, created_by, created_at,
           reviewed_by, reviewed_at, status, rejection_reason
    from quizzes
    where created_by = ${userId} and status in ('pending', 'rejected')
    order by created_at desc
  `) as QuizRow[];

  return hydratePendingQuizzes(rows);
}

export async function getPendingQuizzes(): Promise<PendingQuiz[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, title, description, category_id, created_by, created_at,
           reviewed_by, reviewed_at, status, rejection_reason
    from quizzes
    where status = 'pending'
    order by created_at desc
  `) as QuizRow[];

  return hydratePendingQuizzes(rows);
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
}): Promise<void> {
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(
    input.categoryId,
    "Category",
    MAX_CATEGORY_NAME_LEN,
  );
  const questions = normalizeQuestions(input.questions);

  const sql = getSql();
  const categoryExists = (await sql`
    select id from categories where id = ${categoryId} limit 1
  `) as Array<{ id: string }>;
  if (categoryExists.length === 0) {
    throw new Error("Category not found.");
  }

  await withTransaction(async (tx) => {
    const updated = (await tx`
      update quizzes
      set title = ${title},
          description = ${description},
          category_id = ${categoryId},
          updated_at = now()
      where id = ${input.quizId} and status = 'pending'
      returning id
    `) as Array<{ id: string }>;

    if (updated.length === 0) {
      throw new Error("Pending quiz not found.");
    }

    await tx`
      delete from questions where quiz_id = ${input.quizId}
    `;

    for (const [questionIndex, question] of questions.entries()) {
      const questionRows = (await tx`
        insert into questions (quiz_id, prompt, position)
        values (${input.quizId}, ${question.prompt}, ${questionIndex})
        returning id
      `) as Array<{ id: string }>;

      const questionId = questionRows[0]?.id;
      if (!questionId) {
        throw new Error("Question creation failed.");
      }

      for (const [optionIndex, option] of question.options.entries()) {
        await tx`
          insert into options (question_id, label, is_correct, position)
          values (${questionId}, ${option.label}, ${option.isCorrect}, ${optionIndex})
        `;
      }
    }
  });
}

export async function approvePendingQuiz(input: {
  quizId: string;
  adminId: string;
}): Promise<void> {
  const sql = getSql();
  const rows = (await sql`
    update quizzes
    set status = 'approved',
        reviewed_by = ${input.adminId},
        reviewed_at = now(),
        rejection_reason = null,
        updated_at = now()
    where id = ${input.quizId} and status = 'pending'
    returning id
  `) as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error("Pending quiz not found.");
  }
}

export async function rejectPendingQuiz(input: {
  quizId: string;
  adminId: string;
  rejectionReason: string;
}): Promise<void> {
  const rejectionReason = requireText(
    input.rejectionReason ?? "",
    "Rejection reason",
    MAX_REJECTION_LEN,
  );

  const sql = getSql();
  const rows = (await sql`
    update quizzes
    set status = 'rejected',
        reviewed_by = ${input.adminId},
        reviewed_at = now(),
        rejection_reason = ${rejectionReason},
        updated_at = now()
    where id = ${input.quizId} and status = 'pending'
    returning id
  `) as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error("Pending quiz not found.");
  }
}

export async function createCategory(input: {
  name: string;
  description?: string;
}): Promise<Category> {
  const name = requireText(input.name, "Category name", MAX_CATEGORY_NAME_LEN);
  const description =
    optionalText(input.description, MAX_CATEGORY_DESC_LEN) ?? "";
  const slug = slugify(name);
  if (!slug) {
    throw new Error("Category name is invalid.");
  }

  const sql = getSql();
  try {
    const rows = (await sql`
      insert into categories (id, name, slug, description)
      values (${slug}, ${name}, ${slug}, ${description})
      returning id, name, slug, description
    `) as Category[];

    if (!rows[0]) {
      throw new Error("Category creation failed.");
    }

    return rows[0];
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      throw new Error("Category already exists.");
    }
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const id = requireText(categoryId, "Category", MAX_CATEGORY_NAME_LEN);
  const sql = getSql();

  const used = (await sql`
    select id from quizzes where category_id = ${id} limit 1
  `) as Array<{ id: string }>;

  if (used.length > 0) {
    throw new Error("Category is in use.");
  }

  const rows = (await sql`
    delete from categories where id = ${id} returning id
  `) as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error("Category not found.");
  }
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
}): Promise<Quiz> {
  const title = requireText(input.title, "Title", MAX_TITLE_LEN);
  const description = optionalText(input.description, MAX_DESC_LEN) ?? "";
  const categoryId = requireText(
    input.categoryId,
    "Category",
    MAX_CATEGORY_NAME_LEN,
  );
  const questions = normalizeQuestions(input.questions);

  const sql = getSql();
  const categoryExists = (await sql`
    select id from categories where id = ${categoryId} limit 1
  `) as Array<{ id: string }>;
  if (categoryExists.length === 0) {
    throw new Error("Category not found.");
  }

  let quizId = "";

  await withTransaction(async (tx) => {
    const quizRows = (await tx`
      insert into quizzes (
        title, description, category_id, created_by,
        status, reviewed_by, reviewed_at
      )
      values (
        ${title}, ${description}, ${categoryId}, ${input.adminId},
        'approved', ${input.adminId}, now()
      )
      returning id
    `) as Array<{ id: string }>;

    quizId = quizRows[0]?.id ?? "";
    if (!quizId) {
      throw new Error("Quiz creation failed.");
    }

    for (const [questionIndex, question] of questions.entries()) {
      const questionRows = (await tx`
        insert into questions (quiz_id, prompt, position)
        values (${quizId}, ${question.prompt}, ${questionIndex})
        returning id
      `) as Array<{ id: string }>;

      const questionId = questionRows[0]?.id;
      if (!questionId) {
        throw new Error("Question creation failed.");
      }

      for (const [optionIndex, option] of question.options.entries()) {
        await tx`
          insert into options (question_id, label, is_correct, position)
          values (${questionId}, ${option.label}, ${option.isCorrect}, ${optionIndex})
        `;
      }
    }
  });

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new Error("Quiz creation failed.");
  }
  return quiz;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const id = requireText(quizId, "Quiz", 64);
  const sql = getSql();
  const rows = (await sql`
    delete from quizzes where id = ${id} returning id
  `) as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error("Quiz not found.");
  }
}

export async function deleteUser(input: {
  userId: string;
  requesterId: string;
}): Promise<void> {
  const userId = requireText(input.userId, "User", 64);
  const requesterId = requireText(input.requesterId, "Requester", 64);

  if (userId === requesterId) {
    throw new Error("You cannot delete your own account.");
  }

  const sql = getSql();
  const users = (await sql`
    select id, role, email, username, display_name, created_at,
           salt, password_hash, password_algo
    from users
    where id = ${userId}
    limit 1
  `) as UserRow[];

  const user = users[0];
  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role === "admin") {
    const admins = (await sql`
      select count(*) as count from users where role = 'admin'
    `) as Array<{ count: string }>;
    const adminCount = Number(admins[0]?.count ?? 0);
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last admin.");
    }
  }

  const quizCountRows = (await sql`
    select count(*) as count from quizzes where created_by = ${userId}
  `) as Array<{ count: string }>;
  const quizCount = Number(quizCountRows[0]?.count ?? 0);
  if (quizCount > 0) {
    throw new Error("Delete this user's quizzes first.");
  }

  await sql`
    delete from users where id = ${userId}
  `;
}
