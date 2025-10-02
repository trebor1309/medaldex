export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || null,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null
  });
}
