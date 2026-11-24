export interface FeeAmounts { tuitionAmount?: number | string | null; monthlyAmount?: number | string | null; }
export function resolveStudentFees(student: FeeAmounts, cycle: FeeAmounts) {
  return {
    tuitionAmount: Number(student.tuitionAmount ?? cycle.tuitionAmount),
    monthlyAmount: Number(student.monthlyAmount ?? cycle.monthlyAmount),
  };
}
