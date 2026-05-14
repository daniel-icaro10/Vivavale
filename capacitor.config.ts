import type { CapacitorConfig } from "@capacitor/cli";

// Para builds nativos apontando a um servidor live (Next.js App Router com server components):
// Defina NEXT_PUBLIC_APP_URL no ambiente de build nativo e o app carregará do servidor.
// Para distribuição offline total, é necessário output: "export" no next.config.ts,
// o que remove suporte a server components e API routes.
const serverUrl = process.env.NEXT_PUBLIC_APP_URL;

const config: CapacitorConfig = {
  appId: "com.vivaleve.app",
  appName: "VivaLeve",
  webDir: "out",

  // Em produção nativa: carrega do servidor deployado
  ...(serverUrl && {
    server: {
      url: serverUrl,
      cleartext: false,
      androidScheme: "https",
    },
  }),

  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#f9f8f6",
    preferredContentMode: "mobile",
  },

  android: {
    backgroundColor: "#f9f8f6",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#f9f8f6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 600,
    },

    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#f9f8f6",
      overlaysWebView: false,
    },

    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
