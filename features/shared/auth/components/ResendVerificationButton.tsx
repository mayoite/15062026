import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./AuthControls";
import { Loader2 } from "lucide-react";

const supabase = createClient();

export function ResendVerificationButton({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setBusy(true);
    await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    setSent(true);
  };

  if (sent) {
    return <p className="text-sm text-green-600">Verification email sent!</p>;
  }

  return (
    <Button
      variant="secondary"
      onClick={handleResend}
      disabled={busy}
      leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : undefined}
    >
      {busy ? "Sending..." : "Resend email"}
    </Button>
  );
}
