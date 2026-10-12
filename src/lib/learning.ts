import type { QuizQuestion, Topic } from '../data/learn';

/** A lesson quiz counts as passed with at least 2 of 3 correct. */
export const PASS_MARK = 2;

export function scoreQuiz(quiz: QuizQuestion[], answers: (number | null)[]): number {
  return quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}

export function passedCount(topics: Topic[], quizBest: Record<string, number>): number {
  return topics.filter((t) => (quizBest[t.id] ?? 0) >= PASS_MARK).length;
}

/** Keeps the best score, so retrying a quiz never lowers progress. */
export function recordBest(quizBest: Record<string, number>, topicId: string, score: number): Record<string, number> {
  return { ...quizBest, [topicId]: Math.max(score, quizBest[topicId] ?? 0) };
}
