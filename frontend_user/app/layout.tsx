import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "KhojTalas",
  description: "Immersive lost and found discovery platform. Find and report lost items in your area.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="aurora" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem('kt_user_settings');
                if (raw) {
                  var parsed = JSON.parse(raw);
                  if (parsed && parsed.theme) {
                    document.documentElement.setAttribute('data-theme', parsed.theme);
                  }
                }
              } catch (error) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
