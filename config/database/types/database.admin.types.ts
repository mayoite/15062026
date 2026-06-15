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
      _local_migration_history: {
        Row: {
          filename: string
          applied_at: string
        }
        Insert: {
          filename: string
          applied_at?: string
        }
        Update: {
          filename?: string
          applied_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: number
          name: string
          company: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_queries: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          source: string
          source_path: string | null
          name: string
          company: string | null
          email: string | null
          phone: string | null
          preferred_contact: string
          message: string
          requirement: string | null
          budget: string | null
          timeline: string | null
          status: string
          followup_channel: string
          followup_target: string | null
          followup_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          source?: string
          source_path?: string | null
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          preferred_contact?: string
          message: string
          requirement?: string | null
          budget?: string | null
          timeline?: string | null
          status?: string
          followup_channel?: string
          followup_target?: string | null
          followup_notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          source?: string
          source_path?: string | null
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          preferred_contact?: string
          message?: string
          requirement?: string | null
          budget?: string | null
          timeline?: string | null
          status?: string
          followup_channel?: string
          followup_target?: string | null
          followup_notes?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          team_id: string | null
          email: string
          token: string
          role: string | null
          expires_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          email: string
          token?: string
          role?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          email?: string
          token?: string
          role?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      offices: {
        Row: {
          id: string
          team_id: string | null
          name: string
          slug: string
          payload: Json | null
          tldraw_payload: Json | null
          draft_payload: Json | null
          zone_graph: Json | null
          babylon_config: Json | null
          floor_count: number | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          name: string
          slug: string
          payload?: Json | null
          tldraw_payload?: Json | null
          draft_payload?: Json | null
          zone_graph?: Json | null
          babylon_config?: Json | null
          floor_count?: number | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          name?: string
          slug?: string
          payload?: Json | null
          tldraw_payload?: Json | null
          draft_payload?: Json | null
          zone_graph?: Json | null
          babylon_config?: Json | null
          floor_count?: number | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_comments: {
        Row: {
          id: number
          share_id: number
          plan_id: number
          x: number
          y: number
          item_name: string | null
          message: string
          author_name: string
          created_at: string
        }
        Insert: {
          id?: number
          share_id: number
          plan_id: number
          x: number
          y: number
          item_name?: string | null
          message: string
          author_name: string
          created_at?: string
        }
        Update: {
          id?: number
          share_id?: number
          plan_id?: number
          x?: number
          y?: number
          item_name?: string | null
          message?: string
          author_name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comments_share_id_plan_shares_id_fk"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "plan_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_comments_plan_id_plans_id_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_shares: {
        Row: {
          id: number
          plan_id: number
          share_token: string
          client_name: string | null
          status: string
          status_note: string | null
          is_active: boolean
          viewed_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          plan_id: number
          share_token: string
          client_name?: string | null
          status?: string
          status_note?: string | null
          is_active?: boolean
          viewed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          plan_id?: number
          share_token?: string
          client_name?: string | null
          status?: string
          status_note?: string | null
          is_active?: boolean
          viewed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_shares_plan_id_plans_id_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_versions: {
        Row: {
          id: number
          plan_id: number
          version_number: number
          name: string
          document_json: string
          thumbnail_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          plan_id: number
          version_number: number
          name: string
          document_json: string
          thumbnail_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          plan_id?: number
          version_number?: number
          name?: string
          document_json?: string
          thumbnail_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_plan_id_plans_id_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_settings: {
        Row: {
          id: string
          units: string
          show_measurements: boolean
          grid_size_mm: number
          snap_to_grid: boolean
          show_grid: boolean
          default_room_width_mm: number
          default_room_depth_mm: number
          enabled_tools: string[]
          show_3d: boolean
          show_iso: boolean
          default_zoom: number
          show_contact_shadows: boolean
          max_items_per_plan: number
          max_plans_per_user: number
          show_prices: boolean
          show_lead_time: boolean
          show_pdf_source: boolean
          allow_png_export: boolean
          allow_pdf_export: boolean
          allow_share_link: boolean
          show_watermark: boolean
          default_plan_name: string
          empty_state_heading: string
          empty_state_body: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          units?: string
          show_measurements?: boolean
          grid_size_mm?: number
          snap_to_grid?: boolean
          show_grid?: boolean
          default_room_width_mm?: number
          default_room_depth_mm?: number
          enabled_tools?: string[]
          show_3d?: boolean
          show_iso?: boolean
          default_zoom?: number
          show_contact_shadows?: boolean
          max_items_per_plan?: number
          max_plans_per_user?: number
          show_prices?: boolean
          show_lead_time?: boolean
          show_pdf_source?: boolean
          allow_png_export?: boolean
          allow_pdf_export?: boolean
          allow_share_link?: boolean
          show_watermark?: boolean
          default_plan_name?: string
          empty_state_heading?: string
          empty_state_body?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          units?: string
          show_measurements?: boolean
          grid_size_mm?: number
          snap_to_grid?: boolean
          show_grid?: boolean
          default_room_width_mm?: number
          default_room_depth_mm?: number
          enabled_tools?: string[]
          show_3d?: boolean
          show_iso?: boolean
          default_zoom?: number
          show_contact_shadows?: boolean
          max_items_per_plan?: number
          max_plans_per_user?: number
          show_prices?: boolean
          show_lead_time?: boolean
          show_pdf_source?: boolean
          allow_png_export?: boolean
          allow_pdf_export?: boolean
          allow_share_link?: boolean
          show_watermark?: boolean
          default_plan_name?: string
          empty_state_heading?: string
          empty_state_body?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: number
          name: string
          planner_type: string
          room_width_cm: number
          room_depth_cm: number
          document_json: string
          user_id: string | null
          project_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          planner_type?: string
          room_width_cm?: number
          room_depth_cm?: number
          document_json?: string
          user_id?: string | null
          project_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          planner_type?: string
          room_width_cm?: number
          room_depth_cm?: number
          document_json?: string
          user_id?: string | null
          project_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: number
          name: string
          client_id: number | null
          user_id: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          client_id?: number | null
          user_id: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          client_id?: number | null
          user_id?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quotes: {
        Row: {
          id: number
          plan_id: number
          user_id: string
          client_name: string
          client_company: string
          client_email: string
          project_name: string
          items_json: string
          subtotal: number
          gst: number
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          plan_id: number
          user_id: string
          client_name?: string
          client_company?: string
          client_email?: string
          project_name?: string
          items_json?: string
          subtotal?: number
          gst?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          plan_id?: number
          user_id?: string
          client_name?: string
          client_company?: string
          client_email?: string
          project_name?: string
          items_json?: string
          subtotal?: number
          gst?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_plan_id_plans_id_fk"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: string | null
          joined_at: string | null
        }
        Insert: {
          team_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          room_width_cm: number
          room_depth_cm: number
          layout_json: string
          furniture_count: number
          usage_count: number
          thumbnail_svg: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          category: string
          room_width_cm: number
          room_depth_cm: number
          layout_json: string
          furniture_count?: number
          usage_count?: number
          thumbnail_svg?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          room_width_cm?: number
          room_depth_cm?: number
          layout_json?: string
          furniture_count?: number
          usage_count?: number
          thumbnail_svg?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_history: {
        Row: {
          user_id: string
          viewed_products: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          viewed_products?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          viewed_products?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: string
          plan_tier: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          subscription_status: string | null
          current_period_end: string | null
          created_at: string
          walkthrough_completed: boolean
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          plan_tier?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          created_at?: string
          walkthrough_completed?: boolean
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          plan_tier?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          created_at?: string
          walkthrough_completed?: boolean
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
