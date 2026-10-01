import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";

// Signs a direct browser -> Cloudinary upload. The file itself never touches
// our server; we only vouch that the uploader is a logged-in user, and pin
// the folder and allowed formats into the signature so they can't be changed.
export async function POST() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Image upload isn't configured. Paste an image URL instead." },
      { status: 503 }
    );
  }

  const user = await getCurrentUser();
  // Sellers (product photos) and anyone applying for a store (logo/banner).
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params: Record<string, string> = {
    allowed_formats: "jpg,jpeg,png,webp,avif",
    folder: `ebazar/${user.id}`,
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  return NextResponse.json({
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: { ...params, api_key: apiKey, signature },
  });
}
