import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: classrooms } = await supabase.from("classrooms").select("id, name, teacher_id, meeting_link, created_at").order("created_at");
console.log("Classrooms:", JSON.stringify(classrooms, null, 2));

const { data: enrollments } = await supabase.from("classroom_students").select("*");
console.log("Enrollments:", JSON.stringify(enrollments, null, 2));
