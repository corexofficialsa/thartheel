"use client";

import { useActionState } from "react";
import { toast } from "sonner";

// useActionState plus a success toast: these actions return { error } on
// failure and nothing on success, so a silent save used to look like nothing
// happened. Errors still render inline from the returned state.
export function useActionToast<S extends { error?: string } | undefined>(
  action: (prev: S, formData: FormData) => Promise<S>,
  successMessage: string
) {
  return useActionState<S, FormData>(
    async (prev, formData) => {
      const result = await action(prev as S, formData);
      if (!result?.error) toast.success(successMessage);
      return result;
    },
    undefined as Awaited<S>
  );
}
