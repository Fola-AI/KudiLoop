import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { Button } from "@/components/ui";
import { queryClient } from "@/services/queryClient";

type StatusState = "loading" | "success" | "error";

export default function MagicLinkScreen() {
  const params = useLocalSearchParams();
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const isSignedInRef = useRef(isSignedIn);

  const token = useMemo(() => {
    const tokenParam = params.token;
    if (Array.isArray(tokenParam)) {
      return tokenParam[0]?.trim() || null;
    }
    if (typeof tokenParam === "string") {
      return tokenParam.trim() || null;
    }
    return null;
  }, [params.token]);

  const [status, setStatus] = useState<StatusState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (isSignedIn) {
      queryClient.clear();
      router.replace("/(app)/(tabs)");
    }
  }, [isAuthLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignInLoaded || !isAuthLoaded) return;
    if (isSignedIn) return;

    if (!token) {
      setStatus("error");
      setErrorMessage("This magic link is missing a valid token.");
      return;
    }

    if (!signIn) {
      setStatus("error");
      setErrorMessage("Sign in is not available right now. Please try again.");
      return;
    }

    let isActive = true;
    let navigateTimer: ReturnType<typeof setTimeout> | null = null;
    let errorTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleError = (message: string) => {
      if (!isActive) return;
      errorTimer = setTimeout(() => {
        if (!isActive) return;
        if (!isSignedInRef.current) {
          setStatus("error");
          setErrorMessage(message);
        }
      }, 1200);
    };

    const authenticate = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const result = await signIn.create({
          strategy: "ticket",
          ticket: token,
        });

        if (result?.status === "complete" && result.createdSessionId) {
          await setActive?.({ session: result.createdSessionId });
          queryClient.clear();

          if (!isActive) return;
          setStatus("success");

          navigateTimer = setTimeout(() => {
            if (isActive) {
              router.replace("/(app)/(tabs)");
            }
          }, 800);
        } else {
          scheduleError("Unable to complete sign in. Please try again.");
        }
      } catch (err: any) {
        const message =
          err?.errors?.[0]?.message ||
          err?.errors?.[0]?.longMessage ||
          err?.message ||
          "Unable to sign in with this link.";
        scheduleError(message);
      }
    };

    void authenticate();

    return () => {
      isActive = false;
      if (navigateTimer) clearTimeout(navigateTimer);
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, [isAuthLoaded, isSignInLoaded, isSignedIn, signIn, setActive, token]);

  const renderContent = () => {
    if (isAuthLoaded && isSignedIn) {
      return (
        <>
          <Text style={[styles.title, styles.successText]}>Success!</Text>
          <Text style={styles.subtext}>Redirecting you to the app...</Text>
        </>
      );
    }

    if (status === "success") {
      return (
        <>
          <Text style={[styles.title, styles.successText]}>Success!</Text>
          <Text style={styles.subtext}>Redirecting you to the app...</Text>
        </>
      );
    }

    if (status === "error") {
      return (
        <>
          <Text style={[styles.title, styles.errorText]}>Sign in failed</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <View style={styles.buttonWrapper}>
            <Button variant="outline" onPress={() => router.replace("/(auth)/sign-in")}>
              Back to Sign In
            </Button>
          </View>
        </>
      );
    }

    return (
      <>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.title}>Signing you in...</Text>
        <Text style={styles.subtext}>Please wait a moment</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#FFFFFF",
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subtext: {
    color: "#A1A1AA",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  successText: {
    color: "#22C55E",
  },
  errorText: {
    color: "#EF4444",
  },
  errorMessage: {
    color: "#EF4444",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  buttonWrapper: {
    marginTop: 24,
    width: "100%",
  },
});
