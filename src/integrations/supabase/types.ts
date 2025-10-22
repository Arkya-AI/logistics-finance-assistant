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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      exports: {
        Row: {
          created_at: string
          expires_at: string | null
          file_path: string
          id: string
          invoice_id: string | null
          kind: string
          signed_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_path: string
          id?: string
          invoice_id?: string | null
          kind: string
          signed_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_path?: string
          id?: string
          invoice_id?: string | null
          kind?: string
          signed_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exports_quarantine: {
        Row: {
          created_at: string | null
          expires_at: string | null
          file_path: string | null
          id: string | null
          invoice_id: string | null
          kind: string | null
          signed_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string | null
          invoice_id?: string | null
          kind?: string | null
          signed_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string | null
          invoice_id?: string | null
          kind?: string | null
          signed_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      extractions: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          file_id: string
          gpt_json_ref: string | null
          id: string
          method: string | null
          ocr_json_ref: string | null
          raw_text_ref: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_id: string
          gpt_json_ref?: string | null
          id?: string
          method?: string | null
          ocr_json_ref?: string | null
          raw_text_ref?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_id?: string
          gpt_json_ref?: string | null
          id?: string
          method?: string | null
          ocr_json_ref?: string | null
          raw_text_ref?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions_quarantine: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          file_id: string | null
          gpt_json_ref: string | null
          id: string | null
          method: string | null
          ocr_json_ref: string | null
          raw_text_ref: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_id?: string | null
          gpt_json_ref?: string | null
          id?: string | null
          method?: string | null
          ocr_json_ref?: string | null
          raw_text_ref?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_id?: string | null
          gpt_json_ref?: string | null
          id?: string | null
          method?: string | null
          ocr_json_ref?: string | null
          raw_text_ref?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          blob_ref: string
          created_at: string | null
          filename: string
          id: string
          message_id: string | null
          mime: string
          pages: number | null
          sha256: string
          source: string
          user_id: string
        }
        Insert: {
          blob_ref: string
          created_at?: string | null
          filename: string
          id?: string
          message_id?: string | null
          mime: string
          pages?: number | null
          sha256: string
          source: string
          user_id: string
        }
        Update: {
          blob_ref?: string
          created_at?: string | null
          filename?: string
          id?: string
          message_id?: string | null
          mime?: string
          pages?: number | null
          sha256?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      files_quarantine: {
        Row: {
          blob_ref: string | null
          created_at: string | null
          filename: string | null
          id: string | null
          message_id: string | null
          mime: string | null
          pages: number | null
          sha256: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          blob_ref?: string | null
          created_at?: string | null
          filename?: string | null
          id?: string | null
          message_id?: string | null
          mime?: string | null
          pages?: number | null
          sha256?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          blob_ref?: string | null
          created_at?: string | null
          filename?: string | null
          id?: string | null
          message_id?: string | null
          mime?: string | null
          pages?: number | null
          sha256?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_config: {
        Row: {
          access_token: string
          created_at: string | null
          email: string
          id: string
          refresh_token: string | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          email: string
          id?: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          email?: string
          id?: string
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_config_quarantine: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string | null
          id: string | null
          refresh_token: string | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          quantity: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items_quarantine: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string | null
          invoice_id: string | null
          quantity: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          invoice_id?: string | null
          quantity?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          invoice_id?: string | null
          quantity?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          bill_to: string | null
          confidence: number | null
          created_at: string | null
          currency: string | null
          doctype: string | null
          due_date: string | null
          file_id: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          po_number: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          bill_to?: string | null
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          doctype?: string | null
          due_date?: string | null
          file_id: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          po_number?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          bill_to?: string | null
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          doctype?: string | null
          due_date?: string | null
          file_id?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          po_number?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_quarantine: {
        Row: {
          bill_to: string | null
          confidence: number | null
          created_at: string | null
          currency: string | null
          doctype: string | null
          due_date: string | null
          file_id: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          po_number: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          bill_to?: string | null
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          doctype?: string | null
          due_date?: string | null
          file_id?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          po_number?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          bill_to?: string | null
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          doctype?: string | null
          due_date?: string | null
          file_id?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          po_number?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          from: string
          gmail_id: string
          has_invoice: boolean | null
          id: string
          received_at: string
          subject: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from: string
          gmail_id: string
          has_invoice?: boolean | null
          id?: string
          received_at: string
          subject: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          from?: string
          gmail_id?: string
          has_invoice?: boolean | null
          id?: string
          received_at?: string
          subject?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages_quarantine: {
        Row: {
          created_at: string | null
          from: string | null
          gmail_id: string | null
          has_invoice: boolean | null
          id: string | null
          received_at: string | null
          subject: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from?: string | null
          gmail_id?: string | null
          has_invoice?: boolean | null
          id?: string | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          from?: string | null
          gmail_id?: string | null
          has_invoice?: boolean | null
          id?: string | null
          received_at?: string | null
          subject?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_state: {
        Row: {
          code_verifier: string
          created_at: string | null
          expires_at: string
          state: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string | null
          expires_at: string
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string | null
          expires_at?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_state_quarantine: {
        Row: {
          code_verifier: string | null
          created_at: string | null
          expires_at: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string | null
          expires_at?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          description: string | null
          id: string
        }
        Insert: {
          description?: string | null
          id: string
        }
        Update: {
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      purge_oauth_state: { Args: never; Returns: undefined }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
