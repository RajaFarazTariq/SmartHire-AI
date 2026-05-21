import { SignUp } from "@clerk/nextjs";

import { authPageAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return <SignUp appearance={authPageAppearance} />;
}
