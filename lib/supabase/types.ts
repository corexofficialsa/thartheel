// Hand-written to match supabase/migrations/*.sql. Extend this as later
// phases touch more tables — once the project is linked to a real Supabase
// instance, `supabase gen types typescript` can regenerate it from the
// live schema instead.

export type UserRole = "student" | "teacher" | "board" | "finance" | "admin";
export type ProfileStatus = "pending" | "active" | "rejected" | "removed";

export type Database = {
  public: {
    Tables: {
      centers: {
        Row: { id: string; name: string; address: string | null; created_at: string };
        Insert: { id?: string; name: string; address?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["centers"]["Insert"]>;
        Relationships: [];
      };
      levels: {
        Row: { id: string; name: string; requires_recitation: boolean; created_at: string };
        Insert: { id?: string; name: string; requires_recitation?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["levels"]["Insert"]>;
        Relationships: [];
      };
      batches: {
        Row: { id: string; center_id: string | null; level_id: string | null; name: string; created_at: string };
        Insert: { id?: string; center_id?: string | null; level_id?: string | null; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          status: ProfileStatus;
          username: string | null;
          name: string;
          email: string;
          phone: string | null;
          whatsapp_number: string | null;
          level_id: string | null;
          batch_id: string | null;
          age: number | null;
          place: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          status?: ProfileStatus;
          username?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          whatsapp_number?: string | null;
          level_id?: string | null;
          batch_id?: string | null;
          age?: number | null;
          place?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      classrooms: {
        Row: {
          id: string;
          teacher_id: string;
          level_id: string | null;
          batch_id: string | null;
          name: string;
          meeting_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          level_id?: string | null;
          batch_id?: string | null;
          name: string;
          meeting_link?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["classrooms"]["Insert"]>;
        Relationships: [];
      };
      classroom_students: {
        Row: { classroom_id: string; student_id: string; created_at: string };
        Insert: { classroom_id: string; student_id: string };
        Update: Partial<Database["public"]["Tables"]["classroom_students"]["Insert"]>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          classroom_id: string;
          user_id: string;
          role: "student" | "teacher";
          date: string;
          joined_at: string;
        };
        Insert: never; // written only via the join_classroom() RPC
        Update: never;
        Relationships: [];
      };
      homework: {
        Row: {
          id: string;
          classroom_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          attachment_url: string | null;
          audio_url: string | null;
          due_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          classroom_id: string;
          teacher_id: string;
          title: string;
          description?: string | null;
          attachment_url?: string | null;
          audio_url?: string | null;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["homework"]["Insert"]>;
        Relationships: [];
      };
      homework_submissions: {
        Row: {
          id: string;
          homework_id: string;
          student_id: string;
          text_answer: string | null;
          video_url: string | null;
          audio_url: string | null;
          duration_seconds: number | null;
          mime_type: string | null;
          file_size_bytes: number | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          student_id: string;
          text_answer?: string | null;
          video_url?: string | null;
          audio_url?: string | null;
          duration_seconds?: number | null;
          mime_type?: string | null;
          file_size_bytes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["homework_submissions"]["Insert"]>;
        Relationships: [];
      };
      homework_grades: {
        Row: {
          submission_id: string;
          grade: number | null;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string;
        };
        Insert: { submission_id: string; grade?: number | null; feedback?: string | null; graded_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["homework_grades"]["Insert"]>;
        Relationships: [];
      };
      homework_lock_overrides: {
        Row: {
          id: string;
          student_id: string;
          classroom_id: string;
          granted_by: string;
          reason: string;
          created_at: string;
        };
        Insert: { id?: string; student_id: string; classroom_id: string; granted_by: string; reason: string };
        Update: never;
        Relationships: [];
      };
      conversations: {
        Row: { id: string; type: "student_teacher" | "teacher_board"; created_at: string };
        Insert: never; // created only via start_conversation() RPC
        Update: never;
        Relationships: [];
      };
      conversation_participants: {
        Row: { conversation_id: string; user_id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };
        Insert: { id?: string; conversation_id: string; sender_id: string; content: string };
        Update: never;
        Relationships: [];
      };
      notifications_log: {
        Row: {
          id: string;
          recipient: string;
          channel: "whatsapp" | "email" | "sms";
          template_name: string;
          params: Record<string, string>;
          status: "mock_sent" | "sent" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient: string;
          channel: "whatsapp" | "email" | "sms";
          template_name: string;
          params?: Record<string, string>;
          status?: "mock_sent" | "sent" | "failed";
        };
        Update: never;
        Relationships: [];
      };
      admission_documents: {
        Row: { id: string; profile_id: string; doc_type: string; file_url: string; uploaded_at: string };
        Insert: { id?: string; profile_id: string; doc_type: string; file_url: string };
        Update: never;
        Relationships: [];
      };
      syllabus_tracks: {
        Row: { id: string; name: string; total_milestones: number };
        Insert: { id?: string; name: string; total_milestones: number };
        Update: never;
        Relationships: [];
      };
      student_milestones: {
        Row: {
          id: string;
          student_id: string;
          track_id: string;
          milestone_index: number;
          achieved_at: string;
          recorded_by: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          track_id: string;
          milestone_index: number;
          recorded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      progress_reports: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          period: "daily" | "weekly" | "monthly";
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          period: "daily" | "weekly" | "monthly";
          notes: string;
        };
        Update: never;
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          classroom_id: string;
          title: string;
          exam_type: string;
          scheduled_at: string;
          created_at: string;
        };
        Insert: { id?: string; classroom_id: string; title: string; exam_type: string; scheduled_at: string };
        Update: never;
        Relationships: [];
      };
      exam_results: {
        Row: { id: string; exam_id: string; student_id: string; marks: number; published_at: string | null };
        Insert: { id?: string; exam_id: string; student_id: string; marks: number; published_at?: string | null };
        Update: never;
        Relationships: [];
      };
      teaching_notes: {
        Row: {
          id: string;
          title: string;
          file_url: string;
          level_id: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: { id?: string; title: string; file_url: string; level_id?: string | null; uploaded_by?: string | null };
        Update: never;
        Relationships: [];
      };
      campaign_leads: {
        Row: {
          id: string;
          source: string;
          name: string;
          contact: string;
          status: "new" | "contacted" | "converted" | "lost";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          name: string;
          contact: string;
          status?: "new" | "contacted" | "converted" | "lost";
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_leads"]["Insert"]>;
        Relationships: [];
      };
      finance_records: {
        Row: {
          id: string;
          type: "income" | "expense";
          category: string;
          amount: number;
          description: string | null;
          date: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "income" | "expense";
          category: string;
          amount: number;
          description?: string | null;
          date: string;
          created_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      fee_invoices: {
        Row: {
          id: string;
          student_id: string;
          period: string;
          amount: number;
          status: "due" | "paid" | "overdue";
          paid_at: string | null;
          method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          period: string;
          amount?: number;
          status?: "due" | "paid" | "overdue";
          paid_at?: string | null;
          method?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["fee_invoices"]["Insert"]>;
        Relationships: [];
      };
      caution_deposits: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          status: "held" | "refunded";
          collected_at: string;
          refunded_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          status?: "held" | "refunded";
          refunded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["caution_deposits"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          center_id: string | null;
          period: string;
          category: string;
          limit_amount: number;
          created_at: string;
        };
        Insert: { id?: string; center_id?: string | null; period: string; category: string; limit_amount: number };
        Update: never;
        Relationships: [];
      };
      salary_allocations: {
        Row: {
          id: string;
          profile_id: string;
          role: UserRole;
          amount: number;
          period: string;
          created_at: string;
        };
        Insert: { id?: string; profile_id: string; role: UserRole; amount: number; period: string };
        Update: never;
        Relationships: [];
      };
      quran_ayahs: {
        Row: { id: string; reference: string; arabic_text: string; translation: string };
        Insert: { id?: string; reference: string; arabic_text: string; translation: string };
        Update: never;
        Relationships: [];
      };
      student_recitations: {
        Row: {
          id: string;
          profile_id: string;
          ayah_id: string | null;
          audio_url: string;
          created_at: string;
        };
        Insert: { id?: string; profile_id: string; ayah_id?: string | null; audio_url: string };
        Update: never;
        Relationships: [];
      };
      halaqa_visit_reports: {
        Row: {
          id: string;
          classroom_id: string | null;
          title: string;
          notes: string | null;
          file_url: string | null;
          visited_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          classroom_id?: string | null;
          title: string;
          notes?: string | null;
          file_url?: string | null;
          visited_at?: string;
          created_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      resolve_login_identifier: { Args: { p_identifier: string }; Returns: string | null };
      update_my_contact_info: {
        Args: { p_name: string | null; p_phone: string | null; p_whatsapp: string | null };
        Returns: void;
      };
      approve_profile: { Args: { p_profile_id: string }; Returns: void };
      reject_profile: { Args: { p_profile_id: string; p_reason: string }; Returns: void };
      remove_profile: { Args: { p_profile_id: string; p_reason: string }; Returns: void };
      join_classroom: {
        Args: { p_classroom_id: string };
        Returns: { locked: boolean; reason?: string; meeting_link?: string };
      };
      start_conversation: { Args: { p_other_user_id: string }; Returns: string };
      top_student_leaderboard: {
        Args: Record<string, never>;
        Returns: { profile_id: string; name: string; score: number }[];
      };
    };
  };
};
