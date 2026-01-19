import { router } from "expo-router";

// This file handles deep links when the app is opened from a URL
// URLs like kudiloop://invite/abc123 or https://kudiloop.com/invite/abc123
// Expo Router handles routing automatically based on file structure

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // Transform web URLs to app routes
  // e.g., https://kudiloop.com/invite/abc123 -> /join/abc123
  
  if (path.includes("/invite/")) {
    const token = path.split("/invite/").pop()?.split("?")[0];
    if (token) {
      return `/join/${token}`;
    }
  }
  
  // Return the original path if no transformation needed
  return path;
}

export default function NativeIntent() {
  // Expo Router handles this automatically based on file structure
  // /invite/[token] will match kudiloop://invite/abc123
  return null;
}






