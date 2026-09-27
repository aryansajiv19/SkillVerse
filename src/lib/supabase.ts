import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.");

// PKCE: an OAuth callback only signs in the browser that started the flow. With the default
// implicit flow, any link carrying tokens in its #fragment would replace the visitor's session
// (and a guest's progress with it) with the link author's account.
export const supabase = createClient<Database>(url, key, { auth: { flowType: "pkce" } });
