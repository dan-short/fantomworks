import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];
const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "projects.fantomworks.com", pathname: "/uploads/**" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    remotePatterns.push({
      protocol: "https",
      hostname: new URL(supabaseUrl).hostname,
      pathname: "/storage/v1/object/**",
    });
  } catch {
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
