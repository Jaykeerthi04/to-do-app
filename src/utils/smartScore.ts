/**
 * "Smart" sort: a single score mixing priority, deadline urgency and overdue status.
 *
 *   active task:   score = priorityWeight * 10 + 100 / (hoursUntilDeadline + 1)
 *   overdue task:  score = 1000 + priorityWeight * 10 + min(hoursOverdue, 72)
 *   completed:     score = -1  (always sinks to the bottom)
 *
 * Reasoning:
 *  - Priority contributes a steady base (high=30, medium=20, low=10).
 *  - The urgency term is hyperbolic: it's tiny when a deadline is days away but
 *    explodes as the deadline nears (1h left -> +50, 1 day -> +4, 1 week -> +0.6),
 *    so a low-priority task due in an hour can outrank a high-priority task due next week.
 *  - Overdue tasks get a fixed +1000 boost so they always surface first,
 *    ordered by priority and then by how late they are.
 * Ties are broken by the earlier dueAt (handled in the controller).
 */
export type Priority = "low" | "medium" | "high";

export const PRIORITY_WEIGHT: Record<Priority, number> = { low: 1, medium: 2, high: 3 };

export function smartScore(
  task: { priority: Priority; deadline: Date; completed: boolean },
  now: Date = new Date()
): number {
  if (task.completed) return -1;

  const w = PRIORITY_WEIGHT[task.priority] * 10;
  const hoursLeft = (task.deadline.getTime() - now.getTime()) / 36e5;

  if (hoursLeft < 0) {
    return 1000 + w + Math.min(-hoursLeft, 72);
  }
  return w + 100 / (hoursLeft + 1);
}
