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
      banners: {
        Row: {
          created_at: string
          display_order: number
          ends_at: string | null
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
          display_order?: number
          ends_at?: string | null
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
          display_order?: number
          ends_at?: string | null
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
          created_at: string
          description: string | null
          id: string
          image_url: string
          media_asset_id: string | null
          professional_id: string
          sort_order: number
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          media_asset_id?: string | null
          professional_id: string
          sort_order?: number
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          media_asset_id?: string | null
          professional_id?: string
          sort_order?: number
          status?: string
          title?: string | null
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
      professional_profiles: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status"]
          avatar_media_id: string | null
          average_rating: number
          business_name: string | null
          city: string | null
          cover_media_id: string | null
          created_at: string
          description: string | null
          emergency: boolean
          id: string
          is_featured: boolean
          professional_name: string | null
          profile_status: Database["public"]["Enums"]["profile_status"]
          response_time: string | null
          reviews_count: number
          service_types: Database["public"]["Enums"]["service_type"][]
          slug: string | null
          source: string
          starting_price: number | null
          state: string | null
          updated_at: string
          user_id: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_media_id?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          emergency?: boolean
          id?: string
          is_featured?: boolean
          professional_name?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status"]
          response_time?: string | null
          reviews_count?: number
          service_types?: Database["public"]["Enums"]["service_type"][]
          slug?: string | null
          source?: string
          starting_price?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_media_id?: string | null
          average_rating?: number
          business_name?: string | null
          city?: string | null
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          emergency?: boolean
          id?: string
          is_featured?: boolean
          professional_name?: string | null
          profile_status?: Database["public"]["Enums"]["profile_status"]
          response_time?: string | null
          reviews_count?: number
          service_types?: Database["public"]["Enums"]["service_type"][]
          slug?: string | null
          source?: string
          starting_price?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
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
          category_id: string | null
          city: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          neighborhood: string | null
          postal_code: string | null
          preferred_date: string | null
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
          category_id?: string | null
          city: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          preferred_date?: string | null
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
          category_id?: string | null
          city?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          neighborhood?: string | null
          postal_code?: string | null
          preferred_date?: string | null
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
      get_or_create_conversation: {
        Args: { _pro_id: string; _quote_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      recalc_pro_rating: { Args: { _pro_id: string }; Returns: undefined }
      reject_proposal: { Args: { _proposal_id: string }; Returns: undefined }
      submit_review: {
        Args: { _comment: string; _quote_id: string; _rating: number }
        Returns: string
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "pending"
      app_role: "cliente" | "profissional" | "admin"
      availability_status: "available" | "busy" | "unavailable"
      notification_type:
        | "info"
        | "proposal"
        | "review"
        | "system"
        | "moderation"
        | "opportunity"
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
      app_role: ["cliente", "profissional", "admin"],
      availability_status: ["available", "busy", "unavailable"],
      notification_type: [
        "info",
        "proposal",
        "review",
        "system",
        "moderation",
        "opportunity",
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
