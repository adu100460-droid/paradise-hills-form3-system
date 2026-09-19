export const DEFAULT_GRADE_RULES = [
  { min: 90, max: 100, grade: 1 },
  { min: 80, max: 89, grade: 2 },
  { min: 70, max: 79, grade: 3 },
  { min: 60, max: 69, grade: 4 },
  { min: 55, max: 59, grade: 5 },
  { min: 50, max: 54, grade: 6 },
  { min: 40, max: 49, grade: 7 },
  { min: 35, max: 39, grade: 8 },
  { min: 0, max: 34, grade: 9 },
];

export function getGradeForScore(score: number | null | undefined): number {
  if (score === null || score === undefined) return 9;
  const value = Number(score);

  if (Number.isNaN(value)) return 9;

  for (const rule of DEFAULT_GRADE_RULES) {
    if (value >= rule.min && value <= rule.max) return rule.grade;
  }

  return 9;
}

export function getRemarkForGrade(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return 'Absent / Not Applicable';

  switch (grade) {
    case 1: return 'Excellent';
    case 2: return 'Very Good';
    case 3: return 'Good';
    case 4: return 'Credit';
    case 5: return 'Pass';
    case 6: return 'Fair';
    case 7: return 'Weak';
    case 8: return 'Very Weak';
    default: return 'Fail';
  }
}

export function computeAggregate6(items: Array<{ rawScore: number | null; grade: number | null; type: 'CORE' | 'ELECTIVE'; name: string }>) {
  const core = items.filter((m) => m.type === 'CORE');
  const electives = items.filter((m) => m.type === 'ELECTIVE');

  const selectedElectives = [...electives]
    .sort((a, b) => {
      const gradeDiff = (a.grade ?? 9) - (b.grade ?? 9);
      if (gradeDiff !== 0) return gradeDiff;
      return (b.rawScore ?? 0) - (a.rawScore ?? 0);
    })
    .slice(0, 2);

  const aggregate =
    core.reduce((sum, item) => sum + (item.grade ?? 9), 0) +
    selectedElectives.reduce((sum, item) => sum + (item.grade ?? 9), 0);

  const selectedRawScore =
    core.reduce((sum, item) => sum + (item.rawScore ?? 0), 0) +
    selectedElectives.reduce((sum, item) => sum + (item.rawScore ?? 0), 0);

  return {
    aggregate,
    selectedRawScore,
    selectedElectives,
  };
}
