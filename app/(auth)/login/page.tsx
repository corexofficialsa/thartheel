import Link from "next/link";
import { Briefcase, GraduationCap, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginChooserPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Choose how you&apos;d like to log in.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Link
          href="/login/student"
          className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary hover:bg-secondary/50"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Student log in</span>
            <span className="block text-sm text-muted-foreground">Access classes, homework, and progress.</span>
          </span>
        </Link>
        <Link
          href="/login/teacher"
          className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary hover:bg-secondary/50"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
            <Users className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Teacher log in</span>
            <span className="block text-sm text-muted-foreground">Manage classrooms, homework, and students.</span>
          </span>
        </Link>
        <Link
          href="/login/staff"
          className="group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary hover:bg-secondary/50"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
            <Briefcase className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Staff log in</span>
            <span className="block text-sm text-muted-foreground">Admin, board, and finance accounts.</span>
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
