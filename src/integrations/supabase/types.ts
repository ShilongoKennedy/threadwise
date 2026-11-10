export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_access_state: {
        Row: {
          created_at: string
          reason: string
          status: number
          user_id: string
        }
        Insert: {
          created_at?: string
          reason: string
          status: number
          user_id: string
        }
        Update: {
          created_at?: string
          reason?: string
          status?: number
          user_id?: string
        }
        Relationships: []
      }
      analyst_findings: {
        Row: {
          created_at: string
          id: string
          note: string
          question_id: string
          read_token: string | null
          stance: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          question_id: string
          read_token?: string | null
          stance: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          question_id?: string
          read_token?: string | null
          stance?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_findings_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "analyst_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_questions: {
        Row: {
          created_at: string
          id: string
          question: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      analyst_reads: {
        Row: {
          created_at: string
          input: string
          is_public: boolean
          published_by: string | null
          report: Json
          subject: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          input: string
          is_public?: boolean
          published_by?: string | null
          report: Json
          subject?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          input?: string
          is_public?: boolean
          published_by?: string | null
          report?: Json
          subject?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      claim_watches: {
        Row: {
          checked_at: string | null
          claim: string
          created_at: string
          due_date: string
          id: string
          origin: string | null
          resolution: string | null
          scope: string
          source_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          checked_at?: string | null
          claim: string
          created_at?: string
          due_date: string
          id?: string
          origin?: string | null
          resolution?: string | null
          scope?: string
          source_url?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          checked_at?: string | null
          claim?: string
          created_at?: string
          due_date?: string
          id?: string
          origin?: string | null
          resolution?: string | null
          scope?: string
          source_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      news_briefs_archive: {
        Row: {
          bluf: string | null
          created_at: string | null
          framing: Json | null
          gap: string | null
          headline: string | null
          historical_echo: string | null
          id: string | null
          lat: number | null
          lon: number | null
          model: string | null
          omission: Json | null
          place: string | null
          source_url: string | null
          sources: Json | null
          threat_level: string | null
        }
        Insert: {
          bluf?: string | null
          created_at?: string | null
          framing?: Json | null
          gap?: string | null
          headline?: string | null
          historical_echo?: string | null
          id?: string | null
          lat?: number | null
          lon?: number | null
          model?: string | null
          omission?: Json | null
          place?: string | null
          source_url?: string | null
          sources?: Json | null
          threat_level?: string | null
        }
        Update: {
          bluf?: string | null
          created_at?: string | null
          framing?: Json | null
          gap?: string | null
          headline?: string | null
          historical_echo?: string | null
          id?: string | null
          lat?: number | null
          lon?: number | null
          model?: string | null
          omission?: Json | null
          place?: string | null
          source_url?: string | null
          sources?: Json | null
          threat_level?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          document: Json
          id: string
          revision: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          document?: Json
          id: string
          revision?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          document?: Json
          id?: string
          revision?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_suggested_watch: { Args: { watch_id: string }; Returns: string }
      save_threadwise_workspace: {
        Args: {
          p_document: Json
          p_id: string
          p_revision: number
          p_title: string
        }
        Returns: {
          document: Json
          id: string
          revision: number
          title: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
