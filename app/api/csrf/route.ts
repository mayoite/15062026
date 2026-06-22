import { NextResponse } from "next/server";

import { generateCsrfToken, setCsrfTokenCookie } from "@/lib/security/csrf";

export async function GET() {
  const token = generateCsrfToken();
  await setCsrfTokenCookie(token);
  return NextResponse.json({ token });
}
