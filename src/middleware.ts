import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Recruiter/admin area — needs an authenticated user AND an active organization.
const isOrgRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/jobs(.*)",
  "/candidates(.*)",
  "/upload(.*)",
  "/settings(.*)",
  "/organization(.*)",
  "/activity(.*)",
  "/api/jobs(.*)",
  "/api/candidates(.*)",
]);

// Authenticated-only area — candidates have no org, so these must NOT be org-gated.
const isAuthOnlyRoute = createRouteMatcher([
  "/portal(.*)",
  "/continue(.*)",
  "/onboarding(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

// Exact auth-page roots only (NOT their Clerk sub-routes like /sign-in/factor-one
// or /sign-up/verify-email-address, which must keep working mid-flow).
const isAuthPage = createRouteMatcher(["/sign-in", "/sign-up", "/join"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, redirectToSignIn } = await auth();

  // Already signed in but sitting on an auth page → send them to their home.
  // Fixes the blank "already-signed-in" sign-in screen and the manual
  // back-home → CTA detour after login.
  if (userId && isAuthPage(req)) {
    return NextResponse.redirect(new URL("/continue", req.url));
  }

  if (isOrgRoute(req)) {
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
    // Authenticated but no active organization. New recruiters go create one;
    // candidates (also org-less) get bounced to /portal by the onboarding page.
    if (!orgId) return NextResponse.redirect(new URL("/onboarding", req.url));
    return;
  }

  if (isAuthOnlyRoute(req)) {
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
    // Already in an org? Onboarding is pointless — go to the dashboard.
    if (isOnboardingRoute(req) && orgId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
