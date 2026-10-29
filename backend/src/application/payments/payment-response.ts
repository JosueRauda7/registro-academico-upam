import { Payment } from '../../infrastructure/database/entities/payment.entity';

/** Explicit financial response: never serialize full User/Student relations. */
export function paymentResponse(payment: Payment) {
  return {
    id: payment.id, studentId: payment.studentId, cycleId: payment.cycleId,
    amount: payment.amount, paymentDate: payment.paymentDate, paymentMethod: payment.paymentMethod,
    wompiTransactionId: payment.wompiTransactionId, bankName: payment.bankName,
    bankTransactionCode: payment.bankTransactionCode, receiptImageUrl: payment.receiptImageUrl,
    status: payment.status, type: payment.type, month: payment.month,
    description: payment.description, reference: payment.reference, createdAt: payment.createdAt,
    student: payment.student ? {
      id: payment.student.id, studentCode: payment.student.studentCode, carnet: payment.student.carnet,
      user: payment.student.user ? { id: payment.student.user.id, firstName: payment.student.user.firstName,
        lastName: payment.student.user.lastName, email: payment.student.user.email } : undefined,
    } : undefined,
    cycle: payment.cycle ? { id: payment.cycle.id, name: payment.cycle.name } : undefined,
  };
}
