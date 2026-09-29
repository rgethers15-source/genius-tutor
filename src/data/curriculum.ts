import type { GradeLevel, Subject } from '../types';

export const GRADE_LEVELS: { value: GradeLevel; label: string; typicalAge: number }[] = [
  { value: 'K', label: 'Kindergarten', typicalAge: 5 },
  { value: '1', label: '1st Grade', typicalAge: 6 },
  { value: '2', label: '2nd Grade', typicalAge: 7 },
  { value: '3', label: '3rd Grade', typicalAge: 8 },
  { value: '4', label: '4th Grade', typicalAge: 9 },
  { value: '5', label: '5th Grade', typicalAge: 10 },
  { value: '6', label: '6th Grade', typicalAge: 11 },
  { value: '7', label: '7th Grade', typicalAge: 12 },
  { value: '8', label: '8th Grade', typicalAge: 13 },
  { value: '9', label: '9th Grade', typicalAge: 14 },
  { value: '10', label: '10th Grade', typicalAge: 15 },
  { value: '11', label: '11th Grade', typicalAge: 16 },
  { value: '12', label: '12th Grade', typicalAge: 17 },
];

export const SUBJECTS: { value: Subject; label: string; icon: string }[] = [
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'writing', label: 'Writing', icon: '✏️' },
  { value: 'math', label: 'Math', icon: '🔢' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'socialStudies', label: 'Social Studies', icon: '🌍' },
  { value: 'art', label: 'Art', icon: '🎨' },
  { value: 'music', label: 'Music', icon: '🎵' },
];

/** Suggest a grade from age (typical US mapping); caregiver can override. */
export function suggestGradeFromAge(age: number): GradeLevel {
  const match = GRADE_LEVELS.find((g) => g.typicalAge === age);
  if (match) return match.value;
  if (age <= 5) return 'K';
  if (age >= 17) return '12';
  // Fallback: nearest by typical age.
  return GRADE_LEVELS.reduce((best, g) =>
    Math.abs(g.typicalAge - age) < Math.abs(best.typicalAge - age) ? g : best
  ).value;
}
