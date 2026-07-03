import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sessionCookie = cookies().get("htu_session");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    if (session.role !== "dept_admin" && session.role !== "super_admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Get admin profile
    const profile = await db.getProfile(session.id);
    if (!profile) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          whatsapp: profile.whatsapp || null,
          department_id: profile.department_id
        }
      }
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const sessionCookie = cookies().get("htu_session");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    if (session.role !== "dept_admin" && session.role !== "super_admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { whatsapp } = await request.json();

    // Basic validation
    if (whatsapp && typeof whatsapp !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid WhatsApp number format" },
        { status: 400 }
      );
    }

    // Update profile with WhatsApp number
    const success = await db.updateProfile(session.id, { whatsapp: whatsapp || null });

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Log audit event
    await db.addAuditLog({
      actor_id: session.id,
      action: "PROFILE_UPDATED",
      details: `Admin updated WhatsApp number to ${whatsapp || "(removed)"}`,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
