import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { twMerge } from "tailwind-merge";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feed",
  description: "Muse Feed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div
        className={twMerge(inter.className, "bg-white text-black antialiased")}
      >
        {children}
      </div>
  );
}