import { SignIn } from "@clerk/nextjs";

import { authPageAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return <SignIn appearance={authPageAppearance} />;
}
