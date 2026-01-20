/** @type {import("next").NextConfig} */
let supabaseHostname = "";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  }
} catch {
  supabaseHostname = "";
}

const nextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname }]
      : [],
  },
};

module.exports = nextConfig;
