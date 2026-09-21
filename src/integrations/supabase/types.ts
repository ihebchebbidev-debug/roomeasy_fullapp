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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          discount_usd: number
          guest_id: string
          guest_name: string
          guests: number
          id: string
          listing_id: string
          nights: number
          price_per_night_usd: number
          service_fee_usd: number
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_usd: number
          taxes_usd: number
          total_usd: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          discount_usd?: number
          guest_id: string
          guest_name: string
          guests: number
          id?: string
          listing_id: string
          nights: number
          price_per_night_usd: number
          service_fee_usd?: number
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_usd: number
          taxes_usd?: number
          total_usd: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          discount_usd?: number
          guest_id?: string
          guest_name?: string
          guests?: number
          id?: string
          listing_id?: string
          nights?: number
          price_per_night_usd?: number
          service_fee_usd?: number
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_usd?: number
          taxes_usd?: number
          total_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_nights: {
        Row: {
          blocked: boolean
          listing_id: string
          night: string
          price_usd: number | null
          updated_at: string
        }
        Insert: {
          blocked?: boolean
          listing_id: string
          night: string
          price_usd?: number | null
          updated_at?: string
        }
        Update: {
          blocked?: boolean
          listing_id?: string
          night?: string
          price_usd?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_nights_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          listing_id: string
          position: number
          storage_path: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          storage_path: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          amenities: string[]
          area: number
          baths: number
          beds: number
          city: string
          country: string
          created_at: string
          description: string
          guests: number
          host_id: string
          id: string
          long_stay_discount: number
          long_stay_enabled: boolean
          long_stay_threshold: number
          mobile_discount: number
          mobile_enabled: boolean
          nightly_price_usd: number
          property_type: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          area: number
          baths: number
          beds: number
          city: string
          country: string
          created_at?: string
          description: string
          guests: number
          host_id: string
          id?: string
          long_stay_discount?: number
          long_stay_enabled?: boolean
          long_stay_threshold?: number
          mobile_discount?: number
          mobile_enabled?: boolean
          nightly_price_usd: number
          property_type: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          area?: number
          baths?: number
          beds?: number
          city?: string
          country?: string
          created_at?: string
          description?: string
          guests?: number
          host_id?: string
          id?: string
          long_stay_discount?: number
          long_stay_enabled?: boolean
          long_stay_threshold?: number
          mobile_discount?: number
          mobile_enabled?: boolean
          nightly_price_usd?: number
          property_type?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          guest_id: string
          guest_name: string
          host_reply: string | null
          id: string
          listing_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment: string
          created_at?: string
          guest_id: string
          guest_name: string
          host_reply?: string | null
          id?: string
          listing_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          guest_id?: string
          guest_name?: string
          host_reply?: string | null
          id?: string
          listing_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          can_manage_calendar: boolean
          can_message: boolean
          created_at: string
          id: string
          listing_id: string
          member_email: string
          member_name: string
          member_user_id: string | null
          owner_id: string
        }
        Insert: {
          accepted_at?: string | null
          can_manage_calendar?: boolean
          can_message?: boolean
          created_at?: string
          id?: string
          listing_id: string
          member_email: string
          member_name?: string
          member_user_id?: string | null
          owner_id: string
        }
        Update: {
          accepted_at?: string | null
          can_manage_calendar?: boolean
          can_message?: boolean
          created_at?: string
          id?: string
          listing_id?: string
          member_email?: string
          member_name?: string
          member_user_id?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          booking_id: string | null
          created_at: string
          guest_id: string
          host_id: string
          id: string
          listing_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          guest_id: string
          host_id: string
          id?: string
          listing_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          guest_id?: string
          host_id?: string
          id?: string
          listing_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "guest" | "host" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "declined"
        | "cancelled"
        | "completed"
      listing_status: "draft" | "published" | "suspended"
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
    Enums: {
      app_role: ["guest", "host", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "declined",
        "cancelled",
        "completed",
      ],
      listing_status: ["draft", "published", "suspended"],
    },
  },
} as const
