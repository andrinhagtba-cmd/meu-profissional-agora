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
      admin_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      b2b_companies: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          employees_count: number | null
          id: string
          logo_url: string | null
          monthly_volume: number | null
          name: string
          notes: string | null
          owner_user_id: string | null
          plan: string | null
          segment: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employees_count?: number | null
          id?: string
          logo_url?: string | null
          monthly_volume?: number | null
          name: string
          notes?: string | null
          owner_user_id?: string | null
          plan?: string | null
          segment?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employees_count?: number | null
          id?: string
          logo_url?: string | null
          monthly_volume?: number | null
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          plan?: string | null
          segment?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_primary_href: string | null
          cta_primary_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          display_order: number
          ends_at: string | null
          highlight_text: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          position: string
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          display_order?: number
          ends_at?: string | null
          highlight_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          display_order?: number
          ends_at?: string | null
          highlight_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          position?: string
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      benefits: {
        Row: {
          audience: string
          badge_color: string | null
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          link_url: string | null
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          badge_color?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          badge_color?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          badge_active: boolean
          badge_end_at: string | null
          badge_start_at: string | null
          badge_text: string | null
          badge_variant: string | null
          card_media_id: string | null
          cover_media_id: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          icon_media_id: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_active?: boolean
          badge_end_at?: string | null
          badge_start_at?: string | null
          badge_text?: string | null
          badge_variant?: string | null
          card_media_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          icon_media_id?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_active?: boolean
          badge_end_at?: string | null
          badge_start_at?: string | null
          badge_text?: string | null
          badge_variant?: string | null
          card_media_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          icon_media_id?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_card_media_id_fkey"
            columns: ["card_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_icon_media_id_fkey"
            columns: ["icon_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          institution: string | null
          issued_at: string | null
          professional_id: string
          title: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          institution?: string | null
          issued_at?: string | null
          professional_id: string
          title: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          institution?: string | null
          issued_at?: string | null
          professional_id?: string
          title?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "certifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          cpf: string | null
          created_at: string
          id: string
          notification_preferences: Json
          preferred_contact: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          id?: string
          notification_preferences?: Json
          preferred_contact?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          id?: string
          notification_preferences?: Json
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          channel: string
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          internal_note: string | null
          message: string
          metadata: Json
          name: string
          phone: string | null
          priority: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string | null
          message: string
          metadata?: Json
          name: string
          phone?: string | null
          priority?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string | null
          message?: string
          metadata?: Json
          name?: string
          phone?: string | null
          priority?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          client_id: string
          client_unread_count: number
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          pro_unread_count: number
          professional_id: string
          professional_user_id: string | null
          quote_request_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_unread_count?: number
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          pro_unread_count?: number
          professional_id: string
          professional_user_id?: string | null
          quote_request_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_unread_count?: number
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          pro_unread_count?: number
          professional_id?: string
          professional_user_id?: string | null
          quote_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          min_amount: number | null
          per_user_limit: number | null
          status: string
          target_ids: string[] | null
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          max_uses?: number | null
          min_amount?: number | null
          per_user_limit?: number | null
          status?: string
          target_ids?: string[] | null
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          min_amount?: number | null
          per_user_limit?: number | null
          status?: string
          target_ids?: string[] | null
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string
          id: string
          professional_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          professional_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          position: number
          professional_id: string | null
          reference: string | null
          section: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: number
          professional_id?: string | null
          reference?: string | null
          section?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: number
          professional_id?: string | null
          reference?: string | null
          section?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          action_type: string
          client_id: string | null
          created_at: string
          id: string
          professional_id: string
          quote_request_id: string | null
          source: string | null
        }
        Insert: {
          action_type: string
          client_id?: string | null
          created_at?: string
          id?: string
          professional_id: string
          quote_request_id?: string | null
          source?: string | null
        }
        Update: {
          action_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          quote_request_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bucket_name: string
          checksum: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          is_primary: boolean
          legacy_path: string | null
          mime_type: string | null
          object_path: string
          original_filename: string | null
          sort_order: number
          source_type: string | null
          status: string
          title: string | null
          updated_at: string
          uploaded_by: string | null
          usage_type: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket_name: string
          checksum?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean
          legacy_path?: string | null
          mime_type?: string | null
          object_path: string
          original_filename?: string | null
          sort_order?: number
          source_type?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket_name?: string
          checksum?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean
          legacy_path?: string | null
          mime_type?: string | null
          object_path?: string
          original_filename?: string | null
          sort_order?: number
          source_type?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string | null
          width?: number | null
        }
        Relationships: []
      }
      media_migration_logs: {
        Row: {
          created_at: string
          destination_path: string | null
          error_message: string | null
          id: string
          legacy_path: string
          media_asset_id: string | null
          migrated_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          destination_path?: string | null
          error_message?: string | null
          id?: string
          legacy_path: string
          media_asset_id?: string | null
          migrated_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          destination_path?: string | null
          error_message?: string | null
          id?: string
          legacy_path?: string
          media_asset_id?: string | null
          migrated_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_migration_logs_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          attachment_type: string | null
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          billing_period: string
          created_at: string
          description: string | null
          featured_profile: boolean
          features: Json
          id: string
          lead_limit: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_period?: string
          created_at?: string
          description?: string | null
          featured_profile?: boolean
          features?: Json
          id?: string
          lead_limit?: number | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_period?: string
          created_at?: string
          description?: string | null
          featured_profile?: boolean
          features?: Json
          id?: string
          lead_limit?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          description: string | null
          embed_url: string | null
          external_media_id: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_cover: boolean
          is_featured: boolean
          media_asset_id: string | null
          media_type: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string
          professional_id: string
          sort_order: number
          status: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          embed_url?: string | null
          external_media_id?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_cover?: boolean
          is_featured?: boolean
          media_asset_id?: string | null
          media_type?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string
          professional_id: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          embed_url?: string | null
          external_media_id?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_cover?: boolean
          is_featured?: boolean
          media_asset_id?: string | null
          media_type?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string
          professional_id?: string
          sort_order?: number
          status?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string | null
          created_at: string
          id: string
          is_24h: boolean
          is_closed: boolean
          open_time: string | null
          professional_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          created_at?: string
          id?: string
          is_24h?: boolean
          is_closed?: boolean
          open_time?: string | null
          professional_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          created_at?: string
          id?: string
          is_24h?: boolean
          is_closed?: boolean
          open_time?: string | null
          professional_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_business_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_photo_requests: {
        Row: {
          created_at: string
          id: string
          media_id: string | null
          previous_media_id: string | null
          professional_profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id?: string | null
          previous_media_id?: string | null
          professional_profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string | null
          previous_media_id?: string | null
          professional_profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_photo_requests_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profile_views: {
        Row: {
          anonymous_visitor_id: string | null
          created_at: string
          id: string
          professional_id: string
          referrer: string | null
          session_id: string | null
          source: string | null
          user_agent_category: string | null
          view_day: string
          viewed_at: string
          visitor_user_id: string | null
        }
        Insert: {
          anonymous_visitor_id?: string | null
          created_at?: string
          id?: string
          professional_id: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent_category?: string | null
          view_day?: string
          viewed_at?: string
          visitor_user_id?: string | null
        }
        Update: {
          anonymous_visitor_id?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_agent_category?: string | null
          view_day?: string
          viewed_at?: string
          visitor_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profile_views_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          address_complement: string | null
          address_number: string | null
          address_reference: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          avatar_media_id: string | null
          average_rating: number
          business_name: string | null
          city: string | null
          country: string | null
          cover_media_id: string | null
          created_at: string
          description: string | null
          emergency: boolean
          facebook_url: string | null
          formatted_address: string | null
          google_place_id: string | null
          holiday_note: string | null
          id: string
          initial_view_count: number
          instagram_url: string | null
          instagram_username: string | null
          is_featured: boolean
          latitude: number | null
          location_label: string | null
          longitude: number | null
          neighborhood: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          postal_code: string | null
          professional_name: string | null
          profile_status: Database["public"]["Enums"]["profile_status"]
          public_address_visibility: Database["public"]["Enums"]["address_visibility"]
          real_view_count: number
          response_time: string | null
          reviews_count: number
          search_tags: string[] | null
          serves_at_business_address: boolean
          serves_at_customer_location: boolean
          serves_remotely: boolean
          service_radius_km: number | null
          service_types: Database["public"]["Enums"]["service_type"][]
          slug: string | null
          source: string
          starting_price: number | null
          state: string | null
          street: string | null
          updated_at: string
          user_id: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          website_url: string | null
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          address_reference?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_media_id?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          country?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          emergency?: boolean
          facebook_url?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          holiday_note?: string | null
          id?: string
          initial_view_count?: number
          instagram_url?: string | null
          instagram_username?: string | null
          is_featured?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          postal_code?: string | null
          professional_name?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status"]
          public_address_visibility?: Database["public"]["Enums"]["address_visibility"]
          real_view_count?: number
          response_time?: string | null
          reviews_count?: number
          search_tags?: string[] | null
          serves_at_business_address?: boolean
          serves_at_customer_location?: boolean
          serves_remotely?: boolean
          service_radius_km?: number | null
          service_types?: Database["public"]["Enums"]["service_type"][]
          slug?: string | null
          source?: string
          starting_price?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website_url?: string | null
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          address_reference?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_media_id?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          country?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          emergency?: boolean
          facebook_url?: string | null
          formatted_address?: string | null
          google_place_id?: string | null
          holiday_note?: string | null
          id?: string
          initial_view_count?: number
          instagram_url?: string | null
          instagram_username?: string | null
          is_featured?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          neighborhood?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          postal_code?: string | null
          professional_name?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status"]
          public_address_visibility?: Database["public"]["Enums"]["address_visibility"]
          real_view_count?: number
          response_time?: string | null
          reviews_count?: number
          search_tags?: string[] | null
          serves_at_business_address?: boolean
          serves_at_customer_location?: boolean
          serves_remotely?: boolean
          service_radius_km?: number | null
          service_types?: Database["public"]["Enums"]["service_type"][]
          slug?: string | null
          source?: string
          starting_price?: number | null
          state?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website_url?: string | null
          whatsapp?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_avatar_media_id_fkey"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_profiles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          price_type: Database["public"]["Enums"]["price_type"]
          professional_id: string
          service_id: string
          starting_price: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          price_type?: Database["public"]["Enums"]["price_type"]
          professional_id: string
          service_id: string
          starting_price?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          price_type?: Database["public"]["Enums"]["price_type"]
          professional_id?: string
          service_id?: string
          starting_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_media_id: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_media_id?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_media_id?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_media_id_fkey"
            columns: ["avatar_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      public_branding: {
        Row: {
          accent_color: string | null
          address: string | null
          brand_name: string
          date_format: string | null
          default_currency: string | null
          default_locale: string | null
          default_timezone: string | null
          favicon_media_id: string | null
          footer_config: Json
          id: string
          legal_name: string | null
          logo_dark_media_id: string | null
          logo_light_media_id: string | null
          primary_color: string | null
          singleton: boolean
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          brand_name?: string
          date_format?: string | null
          default_currency?: string | null
          default_locale?: string | null
          default_timezone?: string | null
          favicon_media_id?: string | null
          footer_config?: Json
          id: string
          legal_name?: string | null
          logo_dark_media_id?: string | null
          logo_light_media_id?: string | null
          primary_color?: string | null
          singleton?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          brand_name?: string
          date_format?: string | null
          default_currency?: string | null
          default_locale?: string | null
          default_timezone?: string | null
          favicon_media_id?: string | null
          footer_config?: Json
          id?: string
          legal_name?: string | null
          logo_dark_media_id?: string | null
          logo_light_media_id?: string | null
          primary_color?: string | null
          singleton?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      quote_proposals: {
        Row: {
          created_at: string
          estimated_deadline: string | null
          estimated_price: number | null
          id: string
          message: string
          price_type: Database["public"]["Enums"]["price_type"]
          professional_id: string
          quote_request_id: string
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_deadline?: string | null
          estimated_price?: number | null
          id?: string
          message: string
          price_type?: Database["public"]["Enums"]["price_type"]
          professional_id: string
          quote_request_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_deadline?: string | null
          estimated_price?: number | null
          id?: string
          message?: string
          price_type?: Database["public"]["Enums"]["price_type"]
          professional_id?: string
          quote_request_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_proposals_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_files: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          quote_request_id: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          quote_request_id: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          quote_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_files_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          address_complement: string | null
          address_reference: string | null
          category_id: string | null
          city: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          neighborhood: string | null
          postal_code: string | null
          preferred_date: string | null
          pro_viewed_at: string | null
          selected_professional_id: string | null
          service_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          state: string
          status: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          address_complement?: string | null
          address_reference?: string | null
          category_id?: string | null
          city: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          preferred_date?: string | null
          pro_viewed_at?: string | null
          selected_professional_id?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          state: string
          status?: Database["public"]["Enums"]["quote_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          address_complement?: string | null
          address_reference?: string | null
          category_id?: string | null
          city?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          preferred_date?: string | null
          pro_viewed_at?: string | null
          selected_professional_id?: string | null
          service_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          state?: string
          status?: Database["public"]["Enums"]["quote_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_selected_professional_id_fkey"
            columns: ["selected_professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_status_history: {
        Row: {
          actor_role: string | null
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          quote_request_id: string
          to_status: string
        }
        Insert: {
          actor_role?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          quote_request_id: string
          to_status: string
        }
        Update: {
          actor_role?: string | null
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          quote_request_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_history_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_user_id: string
          resolved_at: string | null
          review_id: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_user_id: string
          resolved_at?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_user_id?: string
          resolved_at?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          professional_reply: string | null
          quote_request_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          professional_reply?: string | null
          quote_request_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          professional_reply?: string | null
          quote_request_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          city: string
          created_at: string
          id: string
          neighborhood: string | null
          postal_code: string | null
          professional_id: string
          radius_km: number | null
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          professional_id: string
          radius_km?: number | null
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          professional_id?: string
          radius_km?: number | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          card_media_id: string | null
          category_id: string
          cover_media_id: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_alt: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          card_media_id?: string | null
          category_id: string
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_alt?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          card_media_id?: string | null
          category_id?: string
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_alt?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_card_media_id_fkey"
            columns: ["card_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_requests: {
        Row: {
          category: string
          category_slug: string | null
          city: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_published: boolean
          proposals_count: number
          request_date: string
          state: string
          updated_at: string
          urgency: string
        }
        Insert: {
          category: string
          category_slug?: string | null
          city?: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_published?: boolean
          proposals_count?: number
          request_date?: string
          state?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          category?: string
          category_slug?: string | null
          city?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_published?: boolean
          proposals_count?: number
          request_date?: string
          state?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          external_reference: string | null
          id: string
          plan_id: string
          professional_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          plan_id: string
          professional_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          external_reference?: string | null
          id?: string
          plan_id?: string
          professional_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          accent_color: string | null
          address: string | null
          brand_name: string
          cnpj: string | null
          created_at: string
          date_format: string | null
          default_currency: string | null
          default_locale: string | null
          default_timezone: string | null
          email_templates: Json
          favicon_media_id: string | null
          footer_config: Json
          id: string
          integrations: Json
          legal_name: string | null
          logo_dark_media_id: string | null
          logo_light_media_id: string | null
          primary_color: string | null
          singleton: boolean
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          brand_name?: string
          cnpj?: string | null
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_locale?: string | null
          default_timezone?: string | null
          email_templates?: Json
          favicon_media_id?: string | null
          footer_config?: Json
          id?: string
          integrations?: Json
          legal_name?: string | null
          logo_dark_media_id?: string | null
          logo_light_media_id?: string | null
          primary_color?: string | null
          singleton?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          brand_name?: string
          cnpj?: string | null
          created_at?: string
          date_format?: string | null
          default_currency?: string | null
          default_locale?: string | null
          default_timezone?: string | null
          email_templates?: Json
          favicon_media_id?: string | null
          footer_config?: Json
          id?: string
          integrations?: Json
          legal_name?: string | null
          logo_dark_media_id?: string | null
          logo_light_media_id?: string | null
          primary_color?: string | null
          singleton?: boolean
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_favicon_media_id_fkey"
            columns: ["favicon_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_logo_dark_media_id_fkey"
            columns: ["logo_dark_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_logo_light_media_id_fkey"
            columns: ["logo_light_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author: string
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          rating: number | null
          role: string | null
          updated_at: string
        }
        Insert: {
          author: string
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          author?: string
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          rating?: number | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      accept_proposal: { Args: { _proposal_id: string }; Returns: undefined }
      admin_set_initial_view_count: {
        Args: { p_professional_id: string; p_reason?: string; p_value: number }
        Returns: number
      }
      count_pro_unread_direct_quotes: { Args: never; Returns: number }
      get_or_create_conversation: {
        Args: { _pro_id: string; _quote_id: string }
        Returns: string
      }
      get_pro_direct_quote: {
        Args: { _id: string }
        Returns: {
          category_name: string
          category_slug: string
          city: string
          client_city: string
          client_email: string
          client_id: string
          client_name: string
          client_phone: string
          created_at: string
          description: string
          id: string
          neighborhood: string
          preferred_date: string
          pro_viewed_at: string
          service_name: string
          service_slug: string
          service_type: string
          state: string
          status: string
          title: string
          urgency: string
        }[]
      }
      get_professional_view_stats: {
        Args: { p_professional_id: string }
        Returns: {
          initial_count: number
          public_total: number
          real_count: number
          views_30d: number
          views_7d: number
          views_today: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_pro_direct_quotes: {
        Args: never
        Returns: {
          category_name: string
          category_slug: string
          city: string
          client_name: string
          created_at: string
          description: string
          id: string
          neighborhood: string
          pro_viewed_at: string
          service_name: string
          service_type: string
          state: string
          status: string
          title: string
          urgency: string
        }[]
      }
      list_public_quote_requests: {
        Args: { _limit?: number }
        Returns: {
          category_name: string
          category_slug: string
          city: string
          created_at: string
          description: string
          id: string
          service_type: Database["public"]["Enums"]["service_type"]
          state: string
          status: Database["public"]["Enums"]["quote_status"]
          title: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }[]
      }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      mark_pro_quote_viewed: { Args: { _id: string }; Returns: undefined }
      moderate_portfolio_item: {
        Args: { _id: string; _notes?: string; _status: string }
        Returns: undefined
      }
      professional_slug_available: {
        Args: { _profile_id?: string; _slug: string }
        Returns: boolean
      }
      recalc_pro_rating: { Args: { _pro_id: string }; Returns: undefined }
      register_professional_profile_view: {
        Args: {
          p_anonymous_visitor_id?: string
          p_referrer?: string
          p_session_id?: string
          p_slug: string
          p_source?: string
          p_ua_category?: string
        }
        Returns: {
          initial_count: number
          public_total: number
          real_count: number
        }[]
      }
      reject_proposal: { Args: { _proposal_id: string }; Returns: undefined }
      reorder_portfolio_items: {
        Args: { _ordered_ids: string[]; _professional_id: string }
        Returns: undefined
      }
      slugify_text: { Args: { _input: string }; Returns: string }
      submit_review: {
        Args: { _comment: string; _quote_id: string; _rating: number }
        Returns: string
      }
      suggest_professional_slugs: {
        Args: { _base: string; _limit?: number; _profile_id?: string }
        Returns: {
          slug: string
        }[]
      }
      unaccent_fallback: { Args: { _input: string }; Returns: string }
      update_quote_status: {
        Args: { _new_status: string; _note?: string; _quote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "pending"
      address_visibility:
        | "hidden"
        | "city_state"
        | "neighborhood_city_state"
        | "full_address"
      app_role: "cliente" | "profissional" | "admin"
      availability_status: "available" | "busy" | "unavailable"
      notification_type:
        | "info"
        | "proposal"
        | "review"
        | "system"
        | "moderation"
        | "opportunity"
        | "proposal_accepted"
        | "proposal_rejected"
        | "quote_status"
        | "message"
        | "message_new"
        | "review_new"
      price_type: "fixed" | "hourly" | "daily" | "per_visit" | "to_quote"
      profile_status: "draft" | "published" | "archived"
      proposal_status: "sent" | "viewed" | "accepted" | "rejected" | "withdrawn"
      quote_status:
        | "draft"
        | "open"
        | "receiving_proposals"
        | "professional_selected"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "expired"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      review_status: "pending" | "approved" | "rejected" | "flagged"
      service_type: "residencial" | "empresarial" | "online"
      subscription_status: "active" | "cancelled" | "expired" | "pending"
      urgency_level: "hoje" | "esta-semana" | "data" | "sem-urgencia"
      verification_status: "pending" | "approved" | "rejected"
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
    Enums: {
      account_status: ["active", "suspended", "pending"],
      address_visibility: [
        "hidden",
        "city_state",
        "neighborhood_city_state",
        "full_address",
      ],
      app_role: ["cliente", "profissional", "admin"],
      availability_status: ["available", "busy", "unavailable"],
      notification_type: [
        "info",
        "proposal",
        "review",
        "system",
        "moderation",
        "opportunity",
        "proposal_accepted",
        "proposal_rejected",
        "quote_status",
        "message",
        "message_new",
        "review_new",
      ],
      price_type: ["fixed", "hourly", "daily", "per_visit", "to_quote"],
      profile_status: ["draft", "published", "archived"],
      proposal_status: ["sent", "viewed", "accepted", "rejected", "withdrawn"],
      quote_status: [
        "draft",
        "open",
        "receiving_proposals",
        "professional_selected",
        "in_progress",
        "completed",
        "cancelled",
        "expired",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      review_status: ["pending", "approved", "rejected", "flagged"],
      service_type: ["residencial", "empresarial", "online"],
      subscription_status: ["active", "cancelled", "expired", "pending"],
      urgency_level: ["hoje", "esta-semana", "data", "sem-urgencia"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
