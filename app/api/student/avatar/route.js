import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = getServerSession(req);
    if (!session || session.role !== 'student') {
      return Response.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { avatarUrl } = await req.json();
    if (!avatarUrl) {
      return Response.json({ success: false, message: 'Avatar image URL is required.' }, { status: 400 });
    }

    // Reject oversized base64 payloads (limit ~500KB decoded ≈ ~680KB base64)
    if (avatarUrl.length > 700000) {
      return Response.json({ success: false, message: 'Image is too large. Please use an image under 500KB.' }, { status: 400 });
    }

    // Only allow base64 data URIs or https URLs
    const isBase64 = avatarUrl.startsWith('data:image/');
    const isHttps = avatarUrl.startsWith('https://');
    if (!isBase64 && !isHttps) {
      return Response.json({ success: false, message: 'Invalid image format.' }, { status: 400 });
    }

    // In a real production setup, we would save to Supabase Storage and get public URL.
    // For this unified adapter, we accept the base64 or storage URL and update profiles table.
    const updatedProfile = await db.updateProfileAvatar(session.email, avatarUrl);

    if (!updatedProfile) {
      return Response.json({ success: false, message: 'Failed to update profile picture.' }, { status: 404 });
    }

    // Update log
    await db.addAuditLog(updatedProfile.id, 'PROFILE_IMAGE_UPDATED', `${updatedProfile.full_name} updated profile picture.`);

    return Response.json({
      success: true,
      message: 'Profile picture updated successfully.',
      avatarUrl: updatedProfile.avatar_url
    });
  } catch (err) {
    console.error("Avatar API Error:", err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
