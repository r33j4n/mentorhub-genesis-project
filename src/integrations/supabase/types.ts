export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          expires_at: string | null
          factors_considered: Json | null
          generated_at: string | null
          is_clicked: boolean | null
          is_session_booked: boolean | null
          match_score: number | null
          mentee_id: string | null
          mentor_id: string | null
          reasoning: Json | null
          recommendation_id: string
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
        }
        Insert: {
          expires_at?: string | null
          factors_considered?: Json | null
          generated_at?: string | null
          is_clicked?: boolean | null
          is_session_booked?: boolean | null
          match_score?: number | null
          mentee_id?: string | null
          mentor_id?: string | null
          reasoning?: Json | null
          recommendation_id?: string
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
        }
        Update: {
          expires_at?: string | null
          factors_considered?: Json | null
          generated_at?: string | null
          is_clicked?: boolean | null
          is_session_booked?: boolean | null
          match_score?: number | null
          mentee_id?: string | null
          mentor_id?: string | null
          reasoning?: Json | null
          recommendation_id?: string
          recommendation_type?: Database["public"]["Enums"]["recommendation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["mentee_id"]
          },
          {
            foreignKeyName: "ai_recommendations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["mentor_id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_id: string
          created_at: string | null
          last_message_at: string | null
          session_id: string | null
          subject: string | null
          type: Database["public"]["Enums"]["conversation_type"] | null
        }
        Insert: {
          conversation_id?: string
          created_at?: string | null
          last_message_at?: string | null
          session_id?: string | null
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"] | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          last_message_at?: string | null
          session_id?: string | null
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      expertise_areas: {
        Row: {
          area_id: string
          category: string | null
          description: string | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          area_id?: string
          category?: string | null
          description?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          area_id?: string
          category?: string | null
          description?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      mentees: {
        Row: {
          budget_range: string | null
          career_stage: Database["public"]["Enums"]["career_stage"] | null
          created_at: string | null
          current_subscription_id: string | null
          goals: string | null
          mentee_id: string
          preferred_communication:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          career_stage?: Database["public"]["Enums"]["career_stage"] | null
          created_at?: string | null
          current_subscription_id?: string | null
          goals?: string | null
          mentee_id: string
          preferred_communication?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          career_stage?: Database["public"]["Enums"]["career_stage"] | null
          created_at?: string | null
          current_subscription_id?: string | null
          goals?: string | null
          mentee_id?: string
          preferred_communication?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mentees_subscription"
            columns: ["current_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "mentees_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentor_availability: {
        Row: {
          availability_id: string
          day_of_week: number
          end_time: string
          is_available: boolean | null
          mentor_id: string | null
          start_time: string
          timezone: string
        }
        Insert: {
          availability_id?: string
          day_of_week: number
          end_time: string
          is_available?: boolean | null
          mentor_id?: string | null
          start_time: string
          timezone: string
        }
        Update: {
          availability_id?: string
          day_of_week?: number
          end_time?: string
          is_available?: boolean | null
          mentor_id?: string | null
          start_time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["mentor_id"]
          },
        ]
      }
      mentor_expertise: {
        Row: {
          area_id: string
          mentor_id: string
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
          years_experience: number | null
        }
        Insert: {
          area_id: string
          mentor_id: string
          proficiency_level: Database["public"]["Enums"]["proficiency_level"]
          years_experience?: number | null
        }
        Update: {
          area_id?: string
          mentor_id?: string
          proficiency_level?: Database["public"]["Enums"]["proficiency_level"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_expertise_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "expertise_areas"
            referencedColumns: ["area_id"]
          },
          {
            foreignKeyName: "mentor_expertise_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["mentor_id"]
          },
        ]
      }
      mentors: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          average_response_time: number | null
          created_at: string | null
          currency: string | null
          experience_years: number | null
          github_url: string | null
          hourly_rate: number | null
          is_approved: boolean | null
          linkedin_url: string | null
          mentor_id: string
          portfolio_url: string | null
          rating: number | null
          response_rate: number | null
          reviews_count: number | null
          total_earnings: number | null
          total_sessions_completed: number | null
          updated_at: string | null
          video_intro_url: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          average_response_time?: number | null
          created_at?: string | null
          currency?: string | null
          experience_years?: number | null
          github_url?: string | null
          hourly_rate?: number | null
          is_approved?: boolean | null
          linkedin_url?: string | null
          mentor_id: string
          portfolio_url?: string | null
          rating?: number | null
          response_rate?: number | null
          reviews_count?: number | null
          total_earnings?: number | null
          total_sessions_completed?: number | null
          updated_at?: string | null
          video_intro_url?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          average_response_time?: number | null
          created_at?: string | null
          currency?: string | null
          experience_years?: number | null
          github_url?: string | null
          hourly_rate?: number | null
          is_approved?: boolean | null
          linkedin_url?: string | null
          mentor_id?: string
          portfolio_url?: string | null
          rating?: number | null
          response_rate?: number | null
          reviews_count?: number | null
          total_earnings?: number | null
          total_sessions_completed?: number | null
          updated_at?: string | null
          video_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mentors_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          is_edited: boolean | null
          message_id: string
          message_type: Database["public"]["Enums"]["message_type"] | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          is_edited?: boolean | null
          message_id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          is_edited?: boolean | null
          message_id?: string
          message_type?: Database["public"]["Enums"]["message_type"] | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          content: string
          created_at: string | null
          is_read: boolean | null
          notification_id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          content: string
          created_at?: string | null
          is_read?: boolean | null
          notification_id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          content?: string
          created_at?: string | null
          is_read?: boolean | null
          notification_id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string
          gateway_response: Json | null
          payer_id: string
          payment_id: string
          payment_intent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          session_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency: string
          gateway_response?: Json | null
          payer_id: string
          payment_id?: string
          payment_intent_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          gateway_response?: Json | null
          payer_id?: string
          payment_id?: string
          payment_intent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["subscription_id"]
          },
        ]
      }
      reviews: {
        Row: {
          communication_rating: number | null
          created_at: string | null
          expertise_rating: number | null
          feedback: string | null
          helpfulness_rating: number | null
          is_public: boolean | null
          is_verified: boolean | null
          mentee_id: string | null
          mentor_id: string | null
          mentor_responded_at: string | null
          mentor_response: string | null
          overall_rating: number
          punctuality_rating: number | null
          review_id: string
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string | null
          expertise_rating?: number | null
          feedback?: string | null
          helpfulness_rating?: number | null
          is_public?: boolean | null
          is_verified?: boolean | null
          mentee_id?: string | null
          mentor_id?: string | null
          mentor_responded_at?: string | null
          mentor_response?: string | null
          overall_rating: number
          punctuality_rating?: number | null
          review_id?: string
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_rating?: number | null
          created_at?: string | null
          expertise_rating?: number | null
          feedback?: string | null
          helpfulness_rating?: number | null
          is_public?: boolean | null
          is_verified?: boolean | null
          mentee_id?: string | null
          mentor_id?: string | null
          mentor_responded_at?: string | null
          mentor_response?: string | null
          overall_rating?: number
          punctuality_rating?: number | null
          review_id?: string
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["mentee_id"]
          },
          {
            foreignKeyName: "reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["mentor_id"]
          },
          {
            foreignKeyName: "reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          base_price: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          commission_rate: number
          created_at: string | null
          currency: string | null
          description: string | null
          discount_applied: number | null
          duration_minutes: number
          final_price: number
          homework_assigned: string | null
          meeting_id: string | null
          meeting_url: string | null
          mentee_id: string | null
          mentor_earnings: number | null
          mentor_id: string | null
          platform_fee: number
          recording_url: string | null
          scheduled_end: string
          scheduled_start: string
          session_id: string
          session_notes: string | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          status: Database["public"]["Enums"]["session_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          base_price: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_rate: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_applied?: number | null
          duration_minutes: number
          final_price: number
          homework_assigned?: string | null
          meeting_id?: string | null
          meeting_url?: string | null
          mentee_id?: string | null
          mentor_earnings?: number | null
          mentor_id?: string | null
          platform_fee: number
          recording_url?: string | null
          scheduled_end: string
          scheduled_start: string
          session_id?: string
          session_notes?: string | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          base_price?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_rate?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_applied?: number | null
          duration_minutes?: number
          final_price?: number
          homework_assigned?: string | null
          meeting_id?: string | null
          meeting_url?: string | null
          mentee_id?: string | null
          mentor_earnings?: number | null
          mentor_id?: string | null
          platform_fee?: number
          recording_url?: string | null
          scheduled_end?: string
          scheduled_start?: string
          session_id?: string
          session_notes?: string | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sessions_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["mentee_id"]
          },
          {
            foreignKeyName: "sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["mentor_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string | null
          currency: string | null
          description: string | null
          discount_percentage: number | null
          features: Json | null
          is_active: boolean | null
          max_sessions_per_month: number | null
          name: string
          plan_id: string
          price: number
        }
        Insert: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          features?: Json | null
          is_active?: boolean | null
          max_sessions_per_month?: number | null
          name: string
          plan_id?: string
          price: number
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          features?: Json | null
          is_active?: boolean | null
          max_sessions_per_month?: number | null
          name?: string
          plan_id?: string
          price?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancelled_at: string | null
          created_at: string | null
          end_date: string
          mentee_id: string | null
          plan_id: string | null
          sessions_used: number | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          subscription_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          end_date: string
          mentee_id?: string | null
          plan_id?: string | null
          sessions_used?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          subscription_id?: string
        }
        Update: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          end_date?: string
          mentee_id?: string | null
          plan_id?: string | null
          sessions_used?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentees"
            referencedColumns: ["mentee_id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          is_active: boolean | null
          role_type: Database["public"]["Enums"]["role_type"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          is_active?: boolean | null
          role_type: Database["public"]["Enums"]["role_type"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          is_active?: boolean | null
          role_type?: Database["public"]["Enums"]["role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string
          first_name: string
          is_active: boolean | null
          is_verified: boolean | null
          language_preference: string | null
          last_login: string | null
          last_name: string
          password_hash: string | null
          phone: string | null
          profile_image: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          first_name: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          last_name: string
          password_hash?: string | null
          phone?: string | null
          profile_image?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          last_name?: string
          password_hash?: string | null
          phone?: string | null
          profile_image?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      billing_cycle: "monthly" | "quarterly" | "yearly"
      career_stage:
        | "student"
        | "entry_level"
        | "mid_level"
        | "senior_level"
        | "executive"
      communication_preference: "chat" | "video" | "both"
      conversation_type: "session_chat" | "general_inquiry" | "support"
      message_type: "text" | "file" | "image" | "system_notification"
      notification_type:
        | "session_booked"
        | "session_reminder"
        | "payment_received"
        | "review_received"
        | "system_update"
      payment_method: "stripe" | "paypal" | "bank_transfer"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      proficiency_level: "beginner" | "intermediate" | "advanced" | "expert"
      recommendation_type:
        | "skill_match"
        | "budget_match"
        | "availability_match"
        | "popular"
      role_type: "admin" | "mentor" | "mentee" | "helpdesk"
      session_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      session_type: "one_on_one" | "group" | "workshop" | "consultation"
      subscription_status: "active" | "cancelled" | "expired" | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["monthly", "quarterly", "yearly"],
      career_stage: [
        "student",
        "entry_level",
        "mid_level",
        "senior_level",
        "executive",
      ],
      communication_preference: ["chat", "video", "both"],
      conversation_type: ["session_chat", "general_inquiry", "support"],
      message_type: ["text", "file", "image", "system_notification"],
      notification_type: [
        "session_booked",
        "session_reminder",
        "payment_received",
        "review_received",
        "system_update",
      ],
      payment_method: ["stripe", "paypal", "bank_transfer"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      proficiency_level: ["beginner", "intermediate", "advanced", "expert"],
      recommendation_type: [
        "skill_match",
        "budget_match",
        "availability_match",
        "popular",
      ],
      role_type: ["admin", "mentor", "mentee", "helpdesk"],
      session_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      session_type: ["one_on_one", "group", "workshop", "consultation"],
      subscription_status: ["active", "cancelled", "expired", "paused"],
    },
  },
} as const
