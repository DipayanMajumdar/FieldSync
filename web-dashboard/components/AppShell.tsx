"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar/Sidebar";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  // Login / landing page
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F3]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main
        className={`
          min-h-screen
          pt-16
          transition-[margin] duration-300 ease-out
          lg:pt-0
          ${
            collapsed
              ? "lg:ml-[82px]"
              : "lg:ml-[270px]"
          }
        `}
      >
        <div className="min-h-screen w-full">
          {children}
        </div>
      </main>
    </div>
  );
}