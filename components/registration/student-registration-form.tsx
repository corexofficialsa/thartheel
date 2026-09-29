"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GENDERS, PROGRAMS, SKILL_QUESTIONS, TERMS_URL, TIME_SLOTS } from "@/lib/registration/student-options";
import { cn } from "@/lib/utils";
import { studentStepSchemas } from "@/lib/validation/registration";
import { AyahRecorderField } from "./ayah-recorder-field";
import { RegistrationSuccess } from "./registration-success";

export type RegisterState = { error?: string; success?: boolean } | undefined;
type RegisterAction = (prevState: RegisterState, formData: FormData) => Promise<RegisterState>;

type Level = { id: string; name: string };
type Ayah = { id: string; reference: string; arabicText: string; translation: string };

const STEPS = [
  { title: "Personal details", description: "Tell us who you are and how to reach you." },
  { title: "Quranic background", description: "A quick self-assessment and a short recitation." },
  { title: "Course & schedule", description: "Choose your program and preferred class time." },
  { title: "Account & terms", description: "Create your password and confirm the terms." },
];

const EMPTY = {
  name: "",
  gender: "",
  age: "",
  place: "",
  address: "",
  phone: "",
  whatsappNumber: "",
  email: "",
  makharij: "",
  qaida: "",
  tajweed: "",
  levelId: "",
  timeSlot: "",
  password: "",
  confirmPassword: "",
  termsAccepted: "",
};
type Fields = typeof EMPTY;
type FieldName = keyof Fields;

// Field names per step, in on-screen order (used to focus the first error).
const STEP_FIELDS: FieldName[][] = [
  ["name", "gender", "age", "place", "address", "phone", "whatsappNumber", "email"],
  ["makharij", "qaida", "tajweed"],
  ["levelId", "timeSlot"],
  ["password", "confirmPassword", "termsAccepted"],
];

export function StudentRegistrationForm({
  action,
  levels,
  ayah,
}: {
  action: RegisterAction;
  levels: Level[];
  ayah: Ayah;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName | "recitation", string>>>({});
  const [recorded, setRecorded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const levelIdByName = new Map(levels.map((l) => [l.name, l.id]));

  function set(name: FieldName, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }
  const bind = (name: FieldName) => ({
    id: name,
    name,
    value: fields[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(name, event.target.value),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  function validateStep(index: number) {
    const values = Object.fromEntries(STEP_FIELDS[index].map((f) => [f, fields[f]]));
    const result = studentStepSchemas[index].safeParse(values);
    const next: typeof errors = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as FieldName;
        next[key] ??= issue.message;
      }
    }
    if (index === 1 && !recorded) next.recitation = "Please record or upload your recitation of the ayah.";
    setErrors(next);
    const firstBad = [...STEP_FIELDS[index], "recitation"].find((f) => next[f as FieldName]);
    if (firstBad) {
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"], #${firstBad}-group`);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return false;
    }
    return true;
  }

  function goTo(index: number) {
    setStep(index);
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(step)) return;
    // Enter on an earlier step moves forward instead of submitting.
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    // Dispatching manually (not via <form action>) keeps React from
    // resetting the form — including the recorded audio — on a failed submit.
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (state?.success) {
    return <RegistrationSuccess />;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="scroll-mt-6 space-y-6">
      <StepIndicator step={step} />

      {/* All steps stay mounted (hidden when inactive) so every answer —
          including the recording — is part of the one final submission. */}
      <section hidden={step !== 0} className="space-y-4">
        <Field label="Full name" error={errors.name} name="name">
          <Input {...bind("name")} autoComplete="name" />
        </Field>

        <ChoiceGroup label="Gender" name="gender" error={errors.gender}>
          {GENDERS.map((g) => (
            <ChoiceCard
              key={g.value}
              name="gender"
              value={g.value}
              checked={fields.gender === g.value}
              disabled={!g.open}
              onSelect={() => set("gender", g.value)}
              title={g.label}
              note={"closedNote" in g ? g.closedNote : undefined}
            />
          ))}
        </ChoiceGroup>

        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <Field label="Age" error={errors.age} name="age">
            <Input {...bind("age")} type="number" inputMode="numeric" min={4} max={90} />
          </Field>
          <Field label="Country & city of residence" error={errors.place} name="place">
            <Input {...bind("place")} placeholder="e.g. Saudi Arabia, Riyadh" autoComplete="address-level2" />
          </Field>
        </div>

        <Field label="Current address" error={errors.address} name="address">
          <Textarea {...bind("address")} rows={2} autoComplete="street-address" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone number" error={errors.phone} name="phone">
            <Input {...bind("phone")} type="tel" inputMode="tel" placeholder="+966 5xxxxxxxx" autoComplete="tel" />
          </Field>
          <Field label="WhatsApp number" error={errors.whatsappNumber} name="whatsappNumber">
            <Input {...bind("whatsappNumber")} type="tel" inputMode="tel" placeholder="+966 5xxxxxxxx" />
          </Field>
        </div>

        <Field label="Email address" error={errors.email} name="email" hint="You'll use this to log in.">
          <Input {...bind("email")} type="email" inputMode="email" autoComplete="email" />
        </Field>
      </section>

      <section hidden={step !== 1} className="space-y-5">
        {SKILL_QUESTIONS.map((q) => (
          <ChoiceGroup
            key={q.field}
            label={
              <>
                {q.title}{" "}
                <span dir="rtl" lang="ar" className="font-normal text-muted-foreground">
                  ({q.arabic})
                </span>
              </>
            }
            name={q.field}
            error={errors[q.field]}
            columns={3}
          >
            {q.options.map((o) => (
              <ChoiceCard
                key={o.value}
                name={q.field}
                value={o.value}
                checked={fields[q.field] === o.value}
                onSelect={() => set(q.field, o.value)}
                title={o.label}
                note={o.hint}
                noteLang="ml"
              />
            ))}
          </ChoiceGroup>
        ))}

        <div id="recitation-group" tabIndex={-1} className="space-y-1.5 outline-none">
          <AyahRecorderField
            ayah={ayah}
            onRecordedChange={(value) => {
              setRecorded(value);
              if (value) setErrors((prev) => ({ ...prev, recitation: undefined }));
            }}
          />
          {errors.recitation && <p className="text-sm text-destructive">{errors.recitation}</p>}
        </div>
      </section>

      <section hidden={step !== 2} className="space-y-5">
        <ChoiceGroup
          label="Preferred program / level"
          name="levelId"
          error={errors.levelId}
          description={
            <>
              Admissions are currently open only for <strong>Level 1: الأساس (Al Asas)</strong>. Enrollment for the
              other levels will reopen in future sessions.
            </>
          }
        >
          {PROGRAMS.map((p) => {
            const levelId = p.levelName ? levelIdByName.get(p.levelName) : undefined;
            const selectable = p.open && !!levelId;
            return (
              <ChoiceCard
                key={p.key}
                name="levelId"
                value={levelId ?? p.key}
                checked={!!levelId && fields.levelId === levelId}
                disabled={!selectable}
                onSelect={() => levelId && set("levelId", levelId)}
                title={
                  <>
                    <span dir="rtl" lang="ar">
                      {p.arabic}
                    </span>{" "}
                    {p.name}
                  </>
                }
                note={selectable ? p.level : `${p.level} · opens in a future session`}
              />
            );
          })}
        </ChoiceGroup>

        <ChoiceGroup
          label="Preferred time slot"
          name="timeSlot"
          error={errors.timeSlot}
          columns={3}
          description="Batches are assigned based on your choice, the Ustad's availability and batch capacity. Timings may shift slightly with prayer times."
        >
          {TIME_SLOTS.map((t) => (
            <ChoiceCard
              key={t.value}
              name="timeSlot"
              value={t.value}
              checked={fields.timeSlot === t.value}
              onSelect={() => set("timeSlot", t.value)}
              title={t.label}
            />
          ))}
        </ChoiceGroup>
      </section>

      <section hidden={step !== 3} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Create a password" error={errors.password} name="password" hint="At least 8 characters.">
            <Input {...bind("password")} type="password" autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword} name="confirmPassword">
            <Input {...bind("confirmPassword")} type="password" autoComplete="new-password" />
          </Field>
        </div>

        <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Please read our full{" "}
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
            >
              Terms &amp; Conditions <ExternalLink className="size-3" />
            </a>{" "}
            before completing registration. By submitting this form, you confirm your acceptance of these rules.
          </p>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm transition-colors",
              fields.termsAccepted ? "border-primary/40" : "hover:border-brass/50",
              errors.termsAccepted && "border-destructive"
            )}
          >
            <input
              type="checkbox"
              name="termsAccepted"
              checked={fields.termsAccepted === "on"}
              onChange={(event) => set("termsAccepted", event.target.checked ? "on" : "")}
              aria-invalid={errors.termsAccepted ? true : undefined}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span>I confirm that I have read and agree to the Mirqath Quran Academy Terms &amp; Conditions.</span>
          </label>
          {errors.termsAccepted && <p className="text-sm text-destructive">{errors.termsAccepted}</p>}
        </div>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
      </section>

      <div className="flex items-center gap-3 border-t pt-5">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={isPending}>
            <ArrowLeft /> Back
          </Button>
        )}
        <Button type="submit" className="ml-auto min-w-32" disabled={isPending}>
          {step < STEPS.length - 1 ? (
            <>
              Next <ArrowRight />
            </>
          ) : isPending ? (
            "Submitting..."
          ) : (
            <>
              Submit registration <Check />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span
            key={s.title}
            className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      <div>
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1 font-heading text-xl font-normal tracking-[-0.01em]">{STEPS[step].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function ChoiceGroup({
  label,
  name,
  error,
  description,
  columns = 2,
  children,
}: {
  label: React.ReactNode;
  name: string;
  error?: string;
  description?: React.ReactNode;
  columns?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className="space-y-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined}
    >
      <legend className="text-sm leading-none font-medium">{label}</legend>
      {description && <p className="pt-1 text-xs text-muted-foreground">{description}</p>}
      <div className={cn("grid gap-2 pt-1", columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
        {children}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// A native radio input dressed as a selectable card: keyboard and screen
// reader behavior come for free, and the value submits with the form.
function ChoiceCard({
  name,
  value,
  checked,
  disabled,
  onSelect,
  title,
  note,
  noteLang,
}: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  note?: string;
  noteLang?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex items-start gap-3 rounded-xl border bg-card px-3.5 py-3 text-sm transition-[border-color,box-shadow]",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:border-brass/50 has-focus-visible:ring-3 has-focus-visible:ring-ring",
        checked && "border-primary shadow-soft ring-1 ring-primary"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-input"
        )}
      >
        {checked && <span className="size-1.5 rounded-full bg-primary-foreground" />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {note && (
          <span lang={noteLang} className="mt-0.5 block text-xs text-muted-foreground">
            {note}
          </span>
        )}
      </span>
    </label>
  );
}
