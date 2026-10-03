"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Role = "ADMIN" | "AGENT" | "CUSTOMER";

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role") as Role | null;

    if (!role) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      if (role === "ADMIN") {
        router.replace("/");
      } else if (role === "AGENT") {
        router.replace("/tickets");
      } else {
        router.replace("/portal");
      }

      return;
    }

    setChecking(false);
  }, [router, pathname, allowedRoles]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Checking access...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
