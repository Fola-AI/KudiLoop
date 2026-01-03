import { Redirect } from "expo-router";

export default function Index() {
  // For testing, go directly to main app
  // Later: check auth state and redirect accordingly
  return <Redirect href="/(app)/(tabs)" />;
  
  // When connecting to real auth:
  // const { isAuthenticated, isLoading } = useAuthStore();
  // if (isLoading) return <LoadingScreen />;
  // return <Redirect href={isAuthenticated ? "/(app)/(tabs)" : "/(auth)/welcome"} />;
}
