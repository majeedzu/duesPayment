import { db } from '@/lib/db';
import { getServerSession } from '@/lib/session';
import { isSupabaseConfigured, getSupabaseAdmin, supabase } from '@/lib/supabase';

const BUCKET = 'dues-image';

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

    // Reject oversized payloads (~500KB decoded ≈ ~680KB base64)
    if (avatarUrl.length > 700000) {
      return Response.json({ success: false, message: 'Image is too large. Please use an image under 500KB.' }, { status: 400 });
    }

    const isBase64 = avatarUrl.startsWith('data:image/');
    const isHttps  = avatarUrl.startsWith('https://');
    if (!isBase64 && !isHttps) {
      return Response.json({ success: false, message: 'Invalid image format.' }, { status: 400 });
    }

    let finalUrl = avatarUrl;

    // ── Upload to Supabase Storage ──────────────────────────────────────────
    if (isSupabaseConfigured() && isBase64) {
      try {
        const adminClient = getSupabaseAdmin() || supabase;

        // Decode base64 → Buffer
        const matches = avatarUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) throw new Error('Invalid base64 image format.');

        const mimeType  = matches[1];                          // e.g. image/jpeg
        const ext       = mimeType.split('/')[1] || 'jpg';    // e.g. jpeg
        const b64data   = matches[2];
        const buffer    = Buffer.from(b64data, 'base64');

        // Store under avatars/<index_number>.<ext>  — overwrites previous upload
        const student   = await db.getStudentByEmail(session.email);
        const fileName  = `avatars/${student?.index_number || session.email.replace('@', '_')}.${ext}`;

        const { error: uploadError } = await adminClient.storage
          .from(BUCKET)
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true          // overwrite on re-upload
          });

        if (uploadError) throw uploadError;

        // Build public URL
        const { data: urlData } = adminClient.storage
          .from(BUCKET)
          .getPublicUrl(fileName);

        finalUrl = urlData?.publicUrl || avatarUrl;
      } catch (storageErr) {
        console.error('Supabase Storage upload error:', storageErr.message);
        // Fall back to saving the base64 directly rather than failing hard
        finalUrl = avatarUrl;
      }
    }

    // ── Save URL to profiles table ──────────────────────────────────────────
    const updatedProfile = await db.updateProfileAvatar(session.email, finalUrl);
    if (!updatedProfile) {
      return Response.json({ success: false, message: 'Failed to update profile picture.' }, { status: 404 });
    }

    await db.addAuditLog(
      updatedProfile.id,
      'PROFILE_IMAGE_UPDATED',
      `${updatedProfile.full_name} updated profile picture.`
    );

    return Response.json({
      success: true,
      message: 'Profile picture updated successfully.',
      avatarUrl: updatedProfile.avatar_url
    });
  } catch (err) {
    console.error('Avatar API Error:', err);
    return Response.json({ success: false, message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
