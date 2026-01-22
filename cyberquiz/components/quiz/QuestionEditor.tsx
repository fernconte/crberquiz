"use client";

import { useMemo } from "react";

export type DraftOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type DraftQuestion = {
  id: string;
  prompt: string;
  options: DraftOption[];
};

type QuestionEditorProps = {
  value: DraftQuestion[];
  onChange: (value: DraftQuestion[]) => void;
};

const MAX_QUESTIONS = 20;
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
}

function createOption(isCorrect = false): DraftOption {
  return { id: `opt-${createId()}`, label: "", isCorrect };
}

export function createDraftQuestion(): DraftQuestion {
  return {
    id: `q-${createId()}`,
    prompt: "",
    options: [createOption(true), createOption(false)],
  };
}

export function QuestionEditor({ value, onChange }: QuestionEditorProps) {
  const canAddQuestion = value.length < MAX_QUESTIONS;

  const hasMultipleQuestions = useMemo(() => value.length > 1, [value.length]);

  function updateQuestion(questionId: string, updater: (q: DraftQuestion) => DraftQuestion) {
    onChange(value.map((question) => (question.id === questionId ? updater(question) : question)));
  }

  function handlePromptChange(questionId: string, prompt: string) {
    updateQuestion(questionId, (question) => ({ ...question, prompt }));
  }

  function handleOptionLabelChange(
    questionId: string,
    optionId: string,
    label: string,
  ) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, label } : option,
      ),
    }));
  }

  function handleCorrectSelect(questionId: string, optionId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) => ({
        ...option,
        isCorrect: option.id === optionId,
      })),
    }));
  }

  function handleAddOption(questionId: string) {
    updateQuestion(questionId, (question) => {
      if (question.options.length >= MAX_OPTIONS) {
        return question;
      }
      return {
        ...question,
        options: [...question.options, createOption(false)],
      };
    });
  }

  function handleRemoveOption(questionId: string, optionId: string) {
    updateQuestion(questionId, (question) => {
      if (question.options.length <= MIN_OPTIONS) {
        return question;
      }
      const nextOptions = question.options.filter((option) => option.id !== optionId);
      const hasCorrect = nextOptions.some((option) => option.isCorrect);
      if (!hasCorrect && nextOptions.length > 0) {
        nextOptions[0] = { ...nextOptions[0], isCorrect: true };
      }
      return { ...question, options: nextOptions };
    });
  }

  function handleAddQuestion() {
    if (!canAddQuestion) {
      return;
    }
    onChange([...value, createDraftQuestion()]);
  }

  function handleRemoveQuestion(questionId: string) {
    if (!hasMultipleQuestions) {
      return;
    }
    onChange(value.filter((question) => question.id !== questionId));
  }

  return (
    <div className="space-y-6">
      {value.map((question, questionIndex) => (
        <div
          key={question.id}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Question {questionIndex + 1}
            </h3>
            <button
              type="button"
              onClick={() => handleRemoveQuestion(question.id)}
              disabled={!hasMultipleQuestions}
              className="text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-cyber-magenta disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove
            </button>
          </div>

          <label className="mt-4 block text-xs text-white/60">
            Prompt
            <input
              type="text"
              value={question.prompt}
              onChange={(event) => handlePromptChange(question.id, event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
            />
          </label>

          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Options and correct answer
            </p>
            {question.options.map((option, optionIndex) => (
              <div key={option.id} className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => handleCorrectSelect(question.id, option.id)}
                    className="h-4 w-4 accent-cyber-neon"
                  />
                  Correct
                </label>
                <input
                  type="text"
                  value={option.label}
                  onChange={(event) =>
                    handleOptionLabelChange(question.id, option.id, event.target.value)
                  }
                  placeholder={`Option ${optionIndex + 1}`}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyber-cyan/60"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(question.id, option.id)}
                  disabled={question.options.length <= MIN_OPTIONS}
                  className="text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-cyber-magenta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleAddOption(question.id)}
              disabled={question.options.length >= MAX_OPTIONS}
              className="text-xs uppercase tracking-[0.3em] text-cyber-cyan transition hover:text-cyber-neon disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add option
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddQuestion}
        disabled={!canAddQuestion}
        className="rounded-full border border-cyber-cyan/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyber-cyan transition hover:border-cyber-neon/60 hover:text-cyber-neon disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add question
      </button>
    </div>
  );
}
