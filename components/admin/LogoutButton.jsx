"use client";

import Button from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * LogoutButton — signs the admin out and returns them to the login form.
 *
 * `signOut()` clears the auth cookies the whole app reads, so the middleware and
 * every server guard see the session end immediately. `router.refresh()` then
 * discards the cached Server Component render, so no signed-in markup lingers.
 */
export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[admin] Sign out failed:", error);
    }
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      loading={busy}
      className="!text-white/80 hover:!text-white"
    >
      Sign out
    </Button>
  );
}
