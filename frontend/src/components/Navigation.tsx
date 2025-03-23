"use client";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "./ThemeToggle";
import { ChevronsUp, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { id: "feed", title: "Feed", href: "/feed", delay: 0.1},
  { id: "signup", title: "Sign Up",  href: "/signup", delay: 0.2},
  { id: "login", title: "Log In", href: "/login", delay: 0.3},
  { id: "write", title: "Write", href: "/write", delay: 0.4},
  { id: "profile", title: "Profile", href: "/profile", delay: 0.5},
];

const Navigation = () => {
  const [showMenu, setShowMenu] = useState(false);

  // Function to handle navigation item click
  const handleNavClick = () => {
    setShowMenu(false);
  };

  return (
    <header className="w-full py-1 mt-1">
      <div className="w-[95%] m-auto flex justify-between items-center bg-primary border dark:border-black p-1 rounded-sm">
        <div>
          <h1 className="text-xl font-extrabold">Muse</h1>
        </div>

        <div className="flex justify-between items-center gap-5">
          <div>
            <ThemeToggle />
          </div>

          <div onClick={() => setShowMenu(prev => !prev)}>
            <motion.div
              animate={{ rotate: showMenu ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {
                showMenu ? <ChevronsUp size={30} className="dark:text-black"/> : <Menu size={30} className="dark:text-black" />
              }
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute right-[3%] top-[8%] z-100">
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {showMenu && navItems.map((item) => (
              <Link 
                key={item.id} 
                href={item.href} 
                onClick={handleNavClick}
              >
                <motion.div 
                  className="flex justify-self-center bg-primary w-fit py-1 px-4 border rounded-sm"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: item.delay }}
                >
                  {item.title}
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navigation;