const SUPABASE_URL = "https://vtvmhljzfrcrhreupxfo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IgyHOjEWTQ1yYc-3X9v3CQ_hA7vI4zy";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
