import { SignUp } from "@clerk/nextjs";

import { authPageAppearance } from "@/lib/clerk-appearance";

// Always renders the Clerk component (it owns sub-routes like email verification).
// Role selection happens beforehand at /join, which sets the `shai_role` cookie;
// /continue reads it after sign-up. forceRedirectUrl guarantees we route there.
export default function SignUpPage() {
  return (
    <SignUp
      appearance={authPageAppearance}
      signInUrl="/sign-in"
      forceRedirectUrl="/continue"
    />
  );
}
