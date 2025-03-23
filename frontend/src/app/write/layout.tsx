import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { twMerge } from "tailwind-merge";
import 'react-quill/dist/quill.snow.css';

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
        <QuillStyles />
        {children}
      </div>
  );
}