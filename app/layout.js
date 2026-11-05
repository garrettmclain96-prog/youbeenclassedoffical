import "./globals.css";
import "./styles/clubhouse.css";
import { BoardProvider } from './components/BoardProvider';
import { BoardShell } from './components/BoardShell';

export const metadata = {
  title: "The Class Board — YouBeenClassed™",
  description: "Big talk. Bigger comebacks. Post a roast, take a spot, and give your group chat something worth sharing.",
  openGraph: {
    title: "The Class Board — YouBeenClassed™",
    description: "Outbid. Roast. Take the Board.",
    url: "https://youbeenclassed.org",
    siteName: "YouBeenClassed™",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800&family=DM+Sans:wght@400;500;600;650;700;750&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><BoardProvider><BoardShell>{children}</BoardShell></BoardProvider></body>
    </html>
  );
}
