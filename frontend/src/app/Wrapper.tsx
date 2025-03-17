"us client";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "next-themes";
import React from "react";

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Navigation />
      {children}
    </ThemeProvider>
  );
};

export default Wrapper;
