export interface SubjectMarkResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  marksObtained: number;
  maxMarks: number;
  passMarks: number;
  isAbsent: boolean;
  percentage: number;
  grade: string;
  isPassed: boolean;
}

export interface ExamOverallResult {
  totalObtainedMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallPassed: boolean;
  subjects: SubjectMarkResult[];
}

export interface GradeRuleDefinition {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  gradePoint: number;
}

export const DEFAULT_GRADE_RULES: GradeRuleDefinition[] = [
  { minPercentage: 90, maxPercentage: 100, grade: 'A+', gradePoint: 4.0 },
  { minPercentage: 80, maxPercentage: 89.99, grade: 'A', gradePoint: 3.7 },
  { minPercentage: 70, maxPercentage: 79.99, grade: 'B+', gradePoint: 3.3 },
  { minPercentage: 60, maxPercentage: 69.99, grade: 'B', gradePoint: 3.0 },
  { minPercentage: 50, maxPercentage: 59.99, grade: 'C', gradePoint: 2.5 },
  { minPercentage: 40, maxPercentage: 49.99, grade: 'D', gradePoint: 2.0 },
  { minPercentage: 0, maxPercentage: 39.99, grade: 'F', gradePoint: 0.0 },
];

export const calculateGrade = (
  percentage: number,
  gradeRules: GradeRuleDefinition[] = DEFAULT_GRADE_RULES
): string => {
  const rounded = Math.round(percentage * 100) / 100;
  for (const rule of gradeRules) {
    if (rounded >= rule.minPercentage && rounded <= rule.maxPercentage) {
      return rule.grade;
    }
  }
  return rounded < 40 ? 'F' : 'A+';
};

export const calculateExamReport = (
  subjects: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    marksObtained: number;
    maxMarks: number;
    passMarks: number;
    isAbsent: boolean;
  }[],
  gradeRules: GradeRuleDefinition[] = DEFAULT_GRADE_RULES
): ExamOverallResult => {
  let totalObtainedMarks = 0;
  let totalMaxMarks = 0;
  let allSubjectsPassed = true;

  const subjectResults: SubjectMarkResult[] = subjects.map((sub) => {
    const marks = sub.isAbsent ? 0 : sub.marksObtained;
    totalObtainedMarks += marks;
    totalMaxMarks += sub.maxMarks;

    const percentage = sub.maxMarks > 0 ? (marks / sub.maxMarks) * 100 : 0;
    const isPassed = !sub.isAbsent && marks >= sub.passMarks;
    if (!isPassed) {
      allSubjectsPassed = false;
    }

    return {
      subjectId: sub.subjectId,
      subjectName: sub.subjectName,
      subjectCode: sub.subjectCode,
      marksObtained: marks,
      maxMarks: sub.maxMarks,
      passMarks: sub.passMarks,
      isAbsent: sub.isAbsent,
      percentage: Math.round(percentage * 100) / 100,
      grade: calculateGrade(percentage, gradeRules),
      isPassed,
    };
  });

  const overallPercentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;
  const roundedPercentage = Math.round(overallPercentage * 100) / 100;
  const overallGrade = calculateGrade(roundedPercentage, gradeRules);
  const overallPassed = allSubjectsPassed && roundedPercentage >= 40;

  return {
    totalObtainedMarks,
    totalMaxMarks,
    overallPercentage: roundedPercentage,
    overallGrade,
    overallPassed,
    subjects: subjectResults,
  };
};
