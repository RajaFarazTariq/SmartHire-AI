import { SignIn, SignedIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { authPageAppearance } from "@/lib/clerk-appearance";
import { RedirectTo } from "@/components/auth/redirect-to";

export default function SignInPage() {
  return (
    <>
      {/* While Clerk initializes — no blank flash. */}
      <ClerkLoading>
        <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        {/* Already authenticated → move into the app immediately. */}
        <SignedIn>
          <RedirectTo href="/continue" />
        </SignedIn>
        {/* Kept mounted in all states so OAuth/verification sub-routes complete;
            renders nothing once signed in (the redirect above takes over). */}
        <SignIn
          appearance={authPageAppearance}
          signUpUrl="/join"
          forceRedirectUrl="/continue"
        />
      </ClerkLoaded>
    </>
  );
}
