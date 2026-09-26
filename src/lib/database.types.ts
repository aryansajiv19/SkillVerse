
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "app_control_secrets": {
                  Row: {
                    "created_at": string,"name": string,"secret_hash": string
                  }
                  Insert: {
                    "created_at"?: string,"name": string,"secret_hash": string
                  }
                  Update: {
                    "created_at"?: string,"name"?: string,"secret_hash"?: string
                  }
                  Relationships: [
                    
                  ]
                },"app_rate_limits": {
                  Row: {
                    "request_count": number,"scope": string,"subject": string,"window_start": string
                  }
                  Insert: {
                    "request_count"?: number,"scope": string,"subject": string,"window_start": string
                  }
                  Update: {
                    "request_count"?: number,"scope"?: string,"subject"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"challenge_completions": {
                  Row: {
                    "challenge_id": string,"completed_at": string,"user_id": string
                  }
                  Insert: {
                    "challenge_id": string,"completed_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "challenge_id"?: string,"completed_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_completions_challenge_id_fkey"
      columns: ["challenge_id"]
isOneToOne: false
      referencedRelation: "challenges"
      referencedColumns: ["id"]
    }
                  ]
                },"challenges": {
                  Row: {
                    "id": string,"skill_id": string,"xp": number
                  }
                  Insert: {
                    "id": string,"skill_id": string,"xp": number
                  }
                  Update: {
                    "id"?: string,"skill_id"?: string,"xp"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenges_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"friend_invites": {
                  Row: {
                    "created_at": string,"expires_at": string,"inviter_id": string,"token_hash": string,"used_at": string | null
                  }
                  Insert: {
                    "created_at"?: string,"expires_at"?: string,"inviter_id": string,"token_hash": string,"used_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"inviter_id"?: string,"token_hash"?: string,"used_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "friend_invites_inviter_id_fkey"
      columns: ["inviter_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"friendships": {
                  Row: {
                    "created_at": string,"friend_id": string,"person_id": string
                  }
                  Insert: {
                    "created_at"?: string,"friend_id": string,"person_id": string
                  }
                  Update: {
                    "created_at"?: string,"friend_id"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_friend_id_fkey"
      columns: ["friend_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"member_ages": {
                  Row: {
                    "corrected_at": string | null,"created_at": string,"date_of_birth": string,"user_id": string
                  }
                  Insert: {
                    "corrected_at"?: string | null,"created_at"?: string,"date_of_birth": string,"user_id": string
                  }
                  Update: {
                    "corrected_at"?: string | null,"created_at"?: string,"date_of_birth"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"moodboard_items": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"label": string,"moodboard_id": string,"note": string | null,"source_url": string | null,"storage_path": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"label": string,"moodboard_id": string,"note"?: string | null,"source_url"?: string | null,"storage_path"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"label"?: string,"moodboard_id"?: string,"note"?: string | null,"source_url"?: string | null,"storage_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "moodboard_items_moodboard_id_fkey"
      columns: ["moodboard_id"]
isOneToOne: false
      referencedRelation: "moodboards"
      referencedColumns: ["id"]
    }
                  ]
                },"moodboards": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"person_id": string,"theme": string | null,"visibility": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"person_id": string,"theme"?: string | null,"visibility"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"person_id"?: string,"theme"?: string | null,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "moodboards_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"people": {
                  Row: {
                    "auth_user_id": string | null,"color": string,"created_at": string,"display_name": string,"emoji": string | null,"id": string,"updated_at": string
                  }
                  Insert: {
                    "auth_user_id"?: string | null,"color"?: string,"created_at"?: string,"display_name": string,"emoji"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "auth_user_id"?: string | null,"color"?: string,"created_at"?: string,"display_name"?: string,"emoji"?: string | null,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"place_collection_items": {
                  Row: {
                    "collection_id": string,"created_at": string,"id": string,"import_id": string | null,"note": string | null,"spot_id": string | null
                  }
                  Insert: {
                    "collection_id": string,"created_at"?: string,"id"?: string,"import_id"?: string | null,"note"?: string | null,"spot_id"?: string | null
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"id"?: string,"import_id"?: string | null,"note"?: string | null,"spot_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_collection_items_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "place_collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "place_collection_items_import_id_fkey"
      columns: ["import_id"]
isOneToOne: false
      referencedRelation: "place_imports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "place_collection_items_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"place_collections": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"name": string,"person_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"name": string,"person_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_collections_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"place_imports": {
                  Row: {
                    "created_at": string,"error_code": string | null,"extracted_data": NonNullable<Json>,"id": string,"normalized_url": string,"person_id": string,"provider": string,"resolved_spot_id": string | null,"source_url": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"error_code"?: string | null,"extracted_data"?: NonNullable<Json>,"id"?: string,"normalized_url": string,"person_id": string,"provider": string,"resolved_spot_id"?: string | null,"source_url": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"error_code"?: string | null,"extracted_data"?: NonNullable<Json>,"id"?: string,"normalized_url"?: string,"person_id"?: string,"provider"?: string,"resolved_spot_id"?: string | null,"source_url"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "place_imports_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "place_imports_resolved_spot_id_fkey"
      columns: ["resolved_spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_access": {
                  Row: {
                    "created_at": string,"plan_id": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"plan_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"plan_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_access_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_host_tokens": {
                  Row: {
                    "created_at": string,"plan_id": string,"token_hash": string
                  }
                  Insert: {
                    "created_at"?: string,"plan_id": string,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"plan_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_host_tokens_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: true
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_spots": {
                  Row: {
                    "advanced": boolean,"plan_id": string,"pool_number": number,"spot_id": string
                  }
                  Insert: {
                    "advanced"?: boolean,"plan_id": string,"pool_number"?: number,"spot_id": string
                  }
                  Update: {
                    "advanced"?: boolean,"plan_id"?: string,"pool_number"?: number,"spot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_spots_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_spots_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "area": string | null,"avoid_preferences": (string)[],"booked": boolean,"booking_owner": string | null,"budget_per_person": number | null,"category": string,"created_at": string,"created_by_user_id": string | null,"deadline": string | null,"event_time": string | null,"id": string,"intelligence_model": string | null,"origin_label": string | null,"origin_latitude": number | null,"origin_longitude": number | null,"pool_count": number,"radius_km": number | null,"reopened_at": string | null,"smart_brief": string | null,"stage": string,"status": string,"title": string,"vibe_preferences": (string)[],"winner_spot_id": string | null
                  }
                  Insert: {
                    "area"?: string | null,"avoid_preferences"?: (string)[],"booked"?: boolean,"booking_owner"?: string | null,"budget_per_person"?: number | null,"category"?: string,"created_at"?: string,"created_by_user_id"?: string | null,"deadline"?: string | null,"event_time"?: string | null,"id"?: string,"intelligence_model"?: string | null,"origin_label"?: string | null,"origin_latitude"?: number | null,"origin_longitude"?: number | null,"pool_count"?: number,"radius_km"?: number | null,"reopened_at"?: string | null,"smart_brief"?: string | null,"stage"?: string,"status"?: string,"title": string,"vibe_preferences"?: (string)[],"winner_spot_id"?: string | null
                  }
                  Update: {
                    "area"?: string | null,"avoid_preferences"?: (string)[],"booked"?: boolean,"booking_owner"?: string | null,"budget_per_person"?: number | null,"category"?: string,"created_at"?: string,"created_by_user_id"?: string | null,"deadline"?: string | null,"event_time"?: string | null,"id"?: string,"intelligence_model"?: string | null,"origin_label"?: string | null,"origin_latitude"?: number | null,"origin_longitude"?: number | null,"pool_count"?: number,"radius_km"?: number | null,"reopened_at"?: string | null,"smart_brief"?: string | null,"stage"?: string,"status"?: string,"title"?: string,"vibe_preferences"?: (string)[],"winner_spot_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "plans_winner_spot_id_fkey"
      columns: ["winner_spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"username": string
                  }
                  Insert: {
                    "created_at"?: string,"id": string,"username": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ratings": {
                  Row: {
                    "again": boolean,"created_at": string,"id": string,"participant_token_hash": string | null,"plan_id": string,"spot_id": string,"stars": number,"user_id": string | null,"voter_name": string
                  }
                  Insert: {
                    "again": boolean,"created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"plan_id": string,"spot_id": string,"stars": number,"user_id"?: string | null,"voter_name": string
                  }
                  Update: {
                    "again"?: boolean,"created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"plan_id"?: string,"spot_id"?: string,"stars"?: number,"user_id"?: string | null,"voter_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ratings_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"rsvps": {
                  Row: {
                    "choice": string,"coming": boolean,"created_at": string,"id": string,"participant_token_hash": string | null,"plan_id": string,"seats_available": number | null,"transport": string | null,"user_id": string | null,"voter_name": string
                  }
                  Insert: {
                    "choice"?: string,"coming"?: boolean,"created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"plan_id": string,"seats_available"?: number | null,"transport"?: string | null,"user_id"?: string | null,"voter_name": string
                  }
                  Update: {
                    "choice"?: string,"coming"?: boolean,"created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"plan_id"?: string,"seats_available"?: number | null,"transport"?: string | null,"user_id"?: string | null,"voter_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rsvps_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"security_events": {
                  Row: {
                    "actor_user_id": string | null,"created_at": string,"event_type": string,"id": number,"metadata": NonNullable<Json>,"outcome": string,"request_id": string | null,"subject_hash": string | null
                  }
                  Insert: {
                    "actor_user_id"?: string | null,"created_at"?: string,"event_type": string,"id"?: never,"metadata"?: NonNullable<Json>,"outcome": string,"request_id"?: string | null,"subject_hash"?: string | null
                  }
                  Update: {
                    "actor_user_id"?: string | null,"created_at"?: string,"event_type"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"outcome"?: string,"request_id"?: string | null,"subject_hash"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"skill_completions": {
                  Row: {
                    "completed_at": string,"skill_id": string,"user_id": string
                  }
                  Insert: {
                    "completed_at"?: string,"skill_id": string,"user_id"?: string
                  }
                  Update: {
                    "completed_at"?: string,"skill_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "skill_completions_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"skills": {
                  Row: {
                    "id": string,"requires": (string)[],"track": string
                  }
                  Insert: {
                    "id": string,"requires"?: (string)[],"track": string
                  }
                  Update: {
                    "id"?: string,"requires"?: (string)[],"track"?: string
                  }
                  Relationships: [
                    
                  ]
                },"spots": {
                  Row: {
                    "address": string | null,"area": string,"booking_url": string | null,"category": string,"created_by_user_id": string | null,"cuisine": string,"description": string | null,"google_place_id": string | null,"id": string,"latitude": number | null,"longitude": number | null,"min_spend": number,"minimum_age": number,"name": string,"open_till": string,"photo_attribution": string | null,"photo_source": string | null,"photo_url": string | null,"places_synced_at": string | null,"price_band": string,"source": string,"vibe": string,"visibility": string
                  }
                  Insert: {
                    "address"?: string | null,"area": string,"booking_url"?: string | null,"category"?: string,"created_by_user_id"?: string | null,"cuisine": string,"description"?: string | null,"google_place_id"?: string | null,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"min_spend": number,"minimum_age"?: number,"name": string,"open_till": string,"photo_attribution"?: string | null,"photo_source"?: string | null,"photo_url"?: string | null,"places_synced_at"?: string | null,"price_band": string,"source"?: string,"vibe": string,"visibility"?: string
                  }
                  Update: {
                    "address"?: string | null,"area"?: string,"booking_url"?: string | null,"category"?: string,"created_by_user_id"?: string | null,"cuisine"?: string,"description"?: string | null,"google_place_id"?: string | null,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"min_spend"?: number,"minimum_age"?: number,"name"?: string,"open_till"?: string,"photo_attribution"?: string | null,"photo_source"?: string | null,"photo_url"?: string | null,"places_synced_at"?: string | null,"price_band"?: string,"source"?: string,"vibe"?: string,"visibility"?: string
                  }
                  Relationships: [
                    
                  ]
                },"visit_collection_items": {
                  Row: {
                    "collection_id": string,"created_at": string,"visit_id": string
                  }
                  Insert: {
                    "collection_id": string,"created_at"?: string,"visit_id": string
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"visit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visit_collection_items_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "visit_collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visit_collection_items_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
      referencedRelation: "visits"
      referencedColumns: ["id"]
    }
                  ]
                },"visit_collections": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"person_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"person_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visit_collections_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"visit_companions": {
                  Row: {
                    "companion_name": string | null,"created_at": string,"id": string,"person_id": string | null,"visit_id": string
                  }
                  Insert: {
                    "companion_name"?: string | null,"created_at"?: string,"id"?: string,"person_id"?: string | null,"visit_id": string
                  }
                  Update: {
                    "companion_name"?: string | null,"created_at"?: string,"id"?: string,"person_id"?: string | null,"visit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visit_companions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visit_companions_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
      referencedRelation: "visits"
      referencedColumns: ["id"]
    }
                  ]
                },"visit_photos": {
                  Row: {
                    "caption": string | null,"created_at": string,"id": string,"person_id": string,"storage_path": string,"visibility": string,"visit_id": string
                  }
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"person_id": string,"storage_path": string,"visibility"?: string,"visit_id": string
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"person_id"?: string,"storage_path"?: string,"visibility"?: string,"visit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visit_photos_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visit_photos_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
      referencedRelation: "visits"
      referencedColumns: ["id"]
    }
                  ]
                },"visits": {
                  Row: {
                    "created_at": string,"group_label": string | null,"id": string,"note": string | null,"person_id": string,"plan_id": string | null,"spot_id": string,"visited_at": string
                  }
                  Insert: {
                    "created_at"?: string,"group_label"?: string | null,"id"?: string,"note"?: string | null,"person_id": string,"plan_id"?: string | null,"spot_id": string,"visited_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"group_label"?: string | null,"id"?: string,"note"?: string | null,"person_id"?: string,"plan_id"?: string | null,"spot_id"?: string,"visited_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "visits_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                },"votes": {
                  Row: {
                    "created_at": string,"id": string,"participant_token_hash": string | null,"phase": string,"plan_id": string,"pool_number": number,"spot_id": string,"user_id": string | null,"value": boolean,"voter_name": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"phase"?: string,"plan_id": string,"pool_number"?: number,"spot_id": string,"user_id"?: string | null,"value": boolean,"voter_name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"participant_token_hash"?: string | null,"phase"?: string,"plan_id"?: string,"pool_number"?: number,"spot_id"?: string,"user_id"?: string | null,"value"?: boolean,"voter_name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "votes_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "votes_spot_id_fkey"
      columns: ["spot_id"]
isOneToOne: false
      referencedRelation: "spots"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "curated_categories": {
                  Row: {
                    "category": string | null
                  }
                  Relationships: [
                    
                  ]
                },"leaderboard": {
                  Row: {
                    "level": number | null,"rank": number | null,"skills_mastered": number | null,"streak": number | null,"user_id": string | null,"username": string | null,"xp": number | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "am_plan_host":
{ Args: { "p_plan_id": string }; Returns: boolean
                           },
"cast_plan_vote":
{ Args: { "p_participant_token_hash": string,"p_phase": string,"p_plan_id": string,"p_pool_number": number,"p_spot_id": string,"p_value": boolean,"p_voter_name": string }; Returns: Json
                           },
"category_age_gates":
{ Args: Record<PropertyKey, never>; Returns: {
              "category": string,"minimum_age": number
            }[]
                           },
"category_min_age":
{ Args: { "p_category": string }; Returns: number
                           },
"claim_plan_access":
{ Args: { "p_plan_id": string }; Returns: boolean
                           },
"clean_app_text":
{ Args: { "maximum": number,"value": string }; Returns: string
                           },
"clean_display_name":
{ Args: { "value": string }; Returns: string
                           },
"consume_app_quota":
{ Args: { "p_scope": string,"p_secret": string }; Returns: boolean
                           },
"consume_otp_limit":
{ Args: { "p_scope": string,"p_secret": string,"p_subject": string }; Returns: boolean
                           },
"correct_birth_date":
{ Args: { "p_date_of_birth": string }; Returns: Json
                           },
"count_my_hosted_plans":
{ Args: { "p_from": string,"p_to": string }; Returns: number
                           },
"create_direct_plan":
{ Args: { "p_plan": Json,"p_spot_id": string }; Returns: Json
                           },
"create_friend_invite":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"create_secure_plan":
{ Args: { "p_plan": Json,"p_spot_ids": (string)[] }; Returns: Json
                           },
"current_member_age":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"delete_my_account":
{ Args: { "p_probe"?: boolean }; Returns: Json
                           },
"delete_plan":
{ Args: { "p_host_token": string,"p_plan_id": string }; Returns: Json
                           },
"edit_plan":
{ Args: { "p_deadline"?: string,"p_host_token": string,"p_plan_id": string,"p_title"?: string }; Returns: Json
                           },
"ensure_authenticated_profile":
{ Args: { "p_color"?: string,"p_display_name": string,"p_emoji"?: string }; Returns: string
                           },
"ensure_default_place_collections":
{ Args: { "profile_id": string }; Returns: undefined
                           },
"execute_plan_command":
{ Args: { "p_command": string,"p_host_token": string,"p_patch"?: Json,"p_plan_id": string }; Returns: Json
                           },
"is_permanent_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"leave_plan":
{ Args: { "p_plan_id": string }; Returns: Json
                           },
"my_custom_spots":
{ Args: Record<PropertyKey, never>; Returns: {
              "area": string,"category": string,"id": string,"minimum_age": number,"name": string,"visibility": string
            }[]
                           },
"plan_host_authorized":
{ Args: { "p_host_token": string,"p_plan_id": string }; Returns: boolean
                           },
"plan_share_preview":
{ Args: { "p_plan_id": string }; Returns: Json
                           },
"preview_friend_invite":
{ Args: { "p_token": string }; Returns: Json
                           },
"purge_security_operational_data":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"rate_plan":
{ Args: { "p_again": boolean,"p_participant_token_hash": string,"p_plan_id": string,"p_spot_id": string,"p_stars": number,"p_voter_name": string }; Returns: undefined
                           },
"record_security_event":
{ Args: { "p_event_type": string,"p_metadata"?: Json,"p_outcome": string,"p_request_id"?: string,"p_secret": string,"p_subject_hash"?: string }; Returns: undefined
                           },
"redeem_friend_invite":
{ Args: { "p_token": string }; Returns: Json
                           },
"reopen_plan":
{ Args: { "p_deadline"?: string,"p_host_token": string,"p_plan_id": string }; Returns: Json
                           },
"set_birth_date":
{ Args: { "p_date_of_birth": string }; Returns: undefined
                           },
"set_plan_rsvp":
{ Args: { "p_choice": string,"p_coming": boolean,"p_participant_token_hash": string,"p_plan_id": string,"p_seats_available"?: number,"p_transport"?: string,"p_voter_name": string }; Returns: undefined
                           },
"skill_unlocked":
{ Args: { "p_skill_id": string }; Returns: boolean
                           },
"spot_required_age":
{ Args: { "p_category": string,"p_spot_minimum_age": number }; Returns: number
                           },
"unrate_plan":
{ Args: { "p_plan_id": string }; Returns: Json
                           },
"valid_control_secret":
{ Args: { "p_secret": string }; Returns: boolean
                           },
"visit_photo_upload_allowed":
{ Args: Record<PropertyKey, never>; Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

