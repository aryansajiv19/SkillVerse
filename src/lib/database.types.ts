export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      challenge_completions: {
        Row: {
          challenge_id: string;
          completed_at: string;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          completed_at?: string;
          user_id?: string;
        };
        Update: {
          challenge_id?: string;
          completed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          id: string;
          kind: string;
          skill_id: string;
          xp: number;
        };
        Insert: {
          id: string;
          kind?: string;
          skill_id: string;
          xp: number;
        };
        Update: {
          id?: string;
          kind?: string;
          skill_id?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      player_stats: {
        Row: {
          best_streak: number;
          challenges_done: number;
          last_active: string | null;
          skills_mastered: number;
          streak: number;
          updated_at: string;
          user_id: string;
          xp: number;
        };
        Insert: {
          best_streak?: number;
          challenges_done?: number;
          last_active?: string | null;
          skills_mastered?: number;
          streak?: number;
          updated_at?: string;
          user_id: string;
          xp?: number;
        };
        Update: {
          best_streak?: number;
          challenges_done?: number;
          last_active?: string | null;
          skills_mastered?: number;
          streak?: number;
          updated_at?: string;
          user_id?: string;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "player_stats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          username: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          username?: string;
        };
        Relationships: [];
      };
      skill_completions: {
        Row: {
          completed_at: string;
          skill_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          skill_id: string;
          user_id?: string;
        };
        Update: {
          completed_at?: string;
          skill_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skill_completions_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      skills: {
        Row: {
          id: string;
          requires: string[];
          track: string;
        };
        Insert: {
          id: string;
          requires?: string[];
          track: string;
        };
        Update: {
          id?: string;
          requires?: string[];
          track?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          best_streak: number | null;
          challenges_done: number | null;
          last_active: string | null;
          level: number | null;
          rank: number | null;
          skills_mastered: number | null;
          streak: number | null;
          user_id: string | null;
          username: string | null;
          xp: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "player_stats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      check_answer: { Args: { p_answer: string; p_challenge_id: string; p_index: number }; Returns: Json };
      consume_ai_quota: { Args: Record<PropertyKey, never>; Returns: undefined };
      reset_skill: { Args: { p_skill_id: string }; Returns: string[] };
      skill_unlocked: { Args: { p_skill_id: string }; Returns: boolean };
      submit_quiz: { Args: { p_answers: string[]; p_challenge_id: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
