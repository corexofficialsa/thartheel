import { ConfirmDeleteButton } from "@/components/common/confirm-delete-button";
import { deleteStudent } from "@/app/(portal)/admin/students/actions";

export function DeleteStudentButton({ studentId, name }: { studentId: string; name: string }) {
  return (
    <ConfirmDeleteButton
      action={deleteStudent.bind(null, studentId)}
      title={`Delete ${name}?`}
      description="This permanently deletes their account, classroom enrollments, attendance, homework, grades, exam results and messages. It can't be undone. Finance ledger entries are kept."
      confirmLabel="Delete student"
      successMessage={`${name} was deleted.`}
    />
  );
}
