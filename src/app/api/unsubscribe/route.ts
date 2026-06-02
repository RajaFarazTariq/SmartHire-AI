import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function flipOff(token: string | null) {
  if (!token) return;
  const pref = await prisma.notificationPreference.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!pref) return; // return 200 anyway to avoid token enumeration
  await prisma.notificationPreference.update({
    where: { userId: pref.userId },
    data: { emailEnabled: false },
  });
}

// Browsers + email clients open the link as GET.
export async function GET(req: Request) {
  const url = new URL(req.url);
  await flipOff(url.searchParams.get("token"));
  return NextResponse.redirect(new URL("/unsubscribe", req.url));
}

// Gmail / Outlook one-click headers POST here.
export async function POST(req: Request) {
  const url = new URL(req.url);
  await flipOff(url.searchParams.get("token"));
  return new NextResponse(null, { status: 200 });
}
