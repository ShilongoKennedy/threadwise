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
      workshop_ideas: {
        Row: {
          body: string
          created_at: string
          id: string
          session_id: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          session_id: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          session_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_ideas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_members: {
        Row: {
          display_name: string
          session_id: string
          user_id: string
        }
        Insert: {
          display_name?: string
          session_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_members_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_presence: {
        Row: {
          audio: boolean
          client_id: string
          display_name: string
          session_id: string
          updated_at: string
          user_id: string
          x: number
          y: number
        }
        Insert: {
          audio?: boolean
          client_id: string
          display_name?: string
          session_id: string
          updated_at?: string
          user_id: string
          x?: number
          y?: number
        }
        Update: {
          audio?: boolean
          client_id?: string
          display_name?: string
          session_id?: string
          updated_at?: string
          user_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "workshop_presence_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_sessions: {
        Row: {
          cards: Json
          created_at: string
          ends_at: string | null
          groups: Json
          host_id: string
          id: string
          join_code: string
          phase: string
          title: string
          vote_budget: number
        }
        Insert: {
          cards?: Json
          created_at?: string
          ends_at?: string | null
          groups?: Json
          host_id: string
          id?: string
          join_code?: string
          phase?: string
          title?: string
          vote_budget?: number
        }
        Update: {
          cards?: Json
          created_at?: string
          ends_at?: string | null
          groups?: Json
          host_id?: string
          id?: string
          join_code?: string
          phase?: string
          title?: string
          vote_budget?: number
        }
        Relationships: []
      }
      workshop_signals: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          recipient_client: string
          recipient_id: string
          sender_client: string
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload: Json
          recipient_client: string
          recipient_id: string
          sender_client: string
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          recipient_client?: string
          recipient_id?: string
          sender_client?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_votes: {
        Row: {
          dots: number
          node_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          dots: number
          node_id: string
          session_id: string
          user_id: string
        }
        Update: {
          dots?: number
          node_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workshop_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      cast_workshop_vote: {
        Args: { p_delta: number; p_node: string; p_session: string }
        Returns: undefined
      }
      join_workshop: {
        Args: { p_code: string; p_name: string }
        Returns: string
      }
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
      workshop_access: { Args: { p_session: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
