import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@clerk/clerk-expo";

// Complete any pending auth session
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    console.log("🔐 === OAUTH CALLBACK ===");
    console.log("🔐 Platform:", Platform.OS);
    console.log("🔐 Params:", JSON.stringify(params));
    console.log("🔐 isLoaded:", isLoaded);
    console.log("🔐 isSignedIn:", isSignedIn);
  }, [params, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      setStatus("Loading authentication...");
      return;
    }

    // Dismiss browser on Android to ensure clean state
    if (Platform.OS === "android") {
      void Promise.resolve(WebBrowser.dismissBrowser()).catch(() => {});
    }

    setStatus(isSignedIn ? "Sign in successful!" : "Completing sign in...");

    // Navigate after short delay to ensure session is ready
    const timer = setTimeout(() => {
      if (isSignedIn) {
        console.log("✅ Navigating to app (signed in)");
        router.replace("/(app)/(tabs)");
      } else {
        // Wait a bit longer - session might still be processing
        const retryTimer = setTimeout(() => {
          if (isSignedIn) {
            router.replace("/(app)/(tabs)");
          } else {
            console.log("⚠️ Not signed in after callback, returning to sign-in");
            router.replace("/(auth)/sign-in");
          }
        }, 2000);
        
        return () => clearTimeout(retryTimer);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.text}>{status}</Text>
      {Platform.OS === "android" && (
        <Text style={styles.subtext}>Please wait, do not close the app</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
  },
  text: {
    color: "#FFFFFF",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
  },
  subtext: {
    color: "#A1A1AA",
    marginTop: 8,
    fontSize: 14,
  },
});
