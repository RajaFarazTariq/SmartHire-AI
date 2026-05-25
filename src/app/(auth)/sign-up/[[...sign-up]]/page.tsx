import { SignUp, SignedIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { authPageAppearance } from "@/lib/clerk-appearance";
import { RedirectTo } from "@/components/auth/redirect-to";

// Role selection happens at /join (sets the `shai_role` cookie); /continue reads
// it after sign-up. forceRedirectUrl guarantees we route there.
export default function SignUpPage() {
  return (
    <>
      <ClerkLoading>
        <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <SignedIn>
          <RedirectTo href="/continue" />
        </SignedIn>
        <SignUp
          appearance={authPageAppearance}
          signInUrl="/sign-in"
          forceRedirectUrl="/continue"
        />
      </ClerkLoaded>
    </>
  );
}
