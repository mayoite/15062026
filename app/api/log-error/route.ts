import { type NextRequest, NextResponse } from "next/server";

interface ErrorPayload {
  message?: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  label?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ErrorPayload;
    
    const {
      message = "Unknown error",
      stack = "No stack trace provided",
      componentStack = "",
      url = "Unknown URL",
      userAgent = "Unknown UserAgent",
      label = "client",
    } = payload;

    // Log the incoming client-side traceback to the server console
    console.error("=== CLIENT-SIDE ERROR RECEIVED ===");
    console.error(`Label: ${label}`);
    console.error(`URL: ${url}`);
    console.error(`User Agent: ${userAgent}`);
    console.error(`Message: ${message}`);
    console.error(`Stack Trace:\n${stack}`);
    if (componentStack) {
      console.error(`Component Stack:\n${componentStack}`);
    }
    console.error("==================================");

    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error("[api/log-error] Failed to log client-side error:", err);
    return NextResponse.json({ error: "Invalid payload or logging failed" }, { status: 400 });
  }
}
