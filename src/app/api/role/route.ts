import { NextResponse, type NextRequest } from "next/server";

// Records the user's chosen role (candidate vs recruiter) in a short-lived
// cookie, then sends them into the Clerk sign-up flow. /continue reads this
// after sign-up to tag the account correctly.
export function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const res = NextResponse.redirect(new URL("/sign-up", req.url));

  if (type === "candidate" || type === "recruiter") {
    res.cookies.set("shai_role", type, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour — just long enough to finish sign-up
    });
  }
  return res;
}
