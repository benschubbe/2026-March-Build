import { NextResponse } from "next/server";

export async function POST() {
  // Email verification is handled at registration time by validating .edu domains
  return NextResponse.json(
    { error: "Email verification is automatic for .edu addresses" },
    { status: 400 },
  );
}
