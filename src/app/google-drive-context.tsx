import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const GOOGLE_AUTH_STORAGE_KEY = "KBTM_GOOGLE_DRIVE_AUTH";
const GOOGLE_CLIENT_ID_ANDROID = "847777426689-a3f579i6464qmvfcpkdp490k8b9jd0on.apps.googleusercontent.com"; // release client ID
const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/drive.file",
];

const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

type GoogleDriveAuthState = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  userEmail?: string;
};

type GoogleDriveContextType = {
  isSignedIn: boolean;
  isLoading: boolean;
  userEmail?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const GoogleDriveContext = createContext<GoogleDriveContextType | null>(null);

async function saveAuthState(state: GoogleDriveAuthState) {
  await AsyncStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(state));
}

async function clearAuthState() {
  await AsyncStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
}

async function loadAuthState(): Promise<GoogleDriveAuthState | null> {
  const savedValue = await AsyncStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
  if (!savedValue) {
    return null;
  }

  try {
    return JSON.parse(savedValue) as GoogleDriveAuthState;
  } catch (error) {
    console.warn("Unable to parse saved Google Drive auth state", error);
    return null;
  }
}

async function refreshAccessToken(refreshToken: string, userEmail?: string): Promise<GoogleDriveAuthState | null> {
  try {
    const body = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID_ANDROID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(googleDiscovery.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const tokenResult = await response.json();
    if (!response.ok || !tokenResult.access_token) {
      return null;
    }

    return {
      accessToken: tokenResult.access_token,
      expiresAt: Date.now() + (Number(tokenResult.expires_in || 3600) * 1000),
      refreshToken,
      userEmail,
    };
  } catch (error) {
    console.warn("Failed to refresh Google Drive access token", error);
    return null;
  }
}

async function fetchUserEmail(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return undefined;
    }

    const payload = await response.json();
    return typeof payload.email === "string" ? payload.email : undefined;
  } catch (error) {
    console.warn("Failed to fetch user info", error);
    return undefined;
  }
}

export function GoogleDriveProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<GoogleDriveAuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreAuth() {
      try {
        const saved = await loadAuthState();
        if (saved && saved.accessToken && saved.expiresAt) {
          setAuthState(saved);
        }
      } catch (error) {
        console.warn("Failed to restore Google Drive auth", error);
      } finally {
        setIsLoading(false);
      }
    }

    restoreAuth();
  }, []);

  const signIn = async () => {
    if (!GOOGLE_CLIENT_ID_ANDROID) {
      throw new Error("Google Drive client ID is not configured.");
    }

    try {
      const redirectUri = "com.vrushabhmodi03.kbtm:/redirect";
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID_ANDROID,
        scopes: GOOGLE_SCOPES,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          access_type: "offline",
          prompt: "consent",
        },
      });

      const result = await request.promptAsync(googleDiscovery);
      if (result.type !== "success" || !result.params?.code) {
        throw new Error("Google sign-in was cancelled.");
      }

      const code = result.params.code;
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID_ANDROID,
          code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier ?? "",
          },
        },
        googleDiscovery
      );

      const accessToken = tokenResponse.accessToken;
      const expiresIn = Number((tokenResponse as any).expiresIn || (tokenResponse as any).expires_in || "3600");
      const refreshToken = (tokenResponse as any).refreshToken || (tokenResponse as any).refresh_token;

      if (!accessToken) {
        throw new Error("Google sign-in did not return an access token.");
      }

      const expiresAt = Date.now() + expiresIn * 1000;
      const userEmail = await fetchUserEmail(accessToken);
      const state: GoogleDriveAuthState = {
        accessToken,
        expiresAt,
        refreshToken,
        userEmail,
      };

      await saveAuthState(state);
      setAuthState(state);
    } catch (error) {
      console.warn("Google Drive sign-in failed", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (authState?.accessToken) {
        await fetch(`${googleDiscovery.revocationEndpoint}?token=${encodeURIComponent(authState.accessToken)}`, {
          method: "POST",
        });
      }
    } catch (error) {
      console.warn("Google Drive sign-out failed", error);
    } finally {
      await clearAuthState();
      setAuthState(null);
    }
  };

  const getAccessToken = async () => {
    if (!authState || !authState.accessToken) {
      return null;
    }

    if (Date.now() > authState.expiresAt - 30000) {
      if (!authState.refreshToken) {
        return null;
      }

      const refreshed = await refreshAccessToken(authState.refreshToken, authState.userEmail);
      if (!refreshed) {
        await clearAuthState();
        setAuthState(null);
        return null;
      }

      await saveAuthState(refreshed);
      setAuthState(refreshed);
      return refreshed.accessToken;
    }

    return authState.accessToken;
  };

  const value = useMemo(
    () => ({
      isSignedIn: !!authState?.accessToken,
      isLoading,
      userEmail: authState?.userEmail,
      signIn,
      signOut,
      getAccessToken,
    }),
    [authState, isLoading]
  );

  return <GoogleDriveContext.Provider value={value}>{children}</GoogleDriveContext.Provider>;
}

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error("useGoogleDrive must be used within a GoogleDriveProvider");
  }
  return context;
}
