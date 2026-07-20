import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/auth.js";
import { getSetting } from "../../../../lib/settings.js";
import { fetchInstagram, fetchFacebook, rangeToDates } from "../../../../lib/smmService.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || "instagram";
  const range = searchParams.get("range") || "30d";
  const { since, until } = rangeToDates(range);

  const token = await getSetting("ig_access_token", "IG_ACCESS_TOKEN");
  const igAccountId = await getSetting("ig_business_account_id", "IG_BUSINESS_ACCOUNT_ID");
  const fbPageId = await getSetting("fb_page_id", "FB_PAGE_ID");

  if (!token) {
    return NextResponse.json({
      connected: false,
      platforms: [
        { platform: "Instagram", followers: 12450, posts: 18, reach: 98000, engagement: 4200 },
      ],
    });
  }

  try {
    if (platform === "facebook") {
      if (!fbPageId) {
        return NextResponse.json(
          { connected: false, error: "Facebook sahifa ID kiritilmagan. Sozlamalar bo'limida 'Facebook sahifa ID' maydonini to'ldiring.", platforms: [] },
          { status: 200 }
        );
      }
      const fb = await fetchFacebook(token, fbPageId, since, until);
      if (fb.error) return NextResponse.json({ connected: false, error: fb.error, platforms: [] }, { status: 200 });
      return NextResponse.json({ connected: true, platforms: [fb] });
    }

    if (!igAccountId) {
      return NextResponse.json(
        { connected: false, error: "Instagram business akkaunt ID kiritilmagan.", platforms: [] },
        { status: 200 }
      );
    }
    const ig = await fetchInstagram(token, igAccountId, since, until);
    if (ig.error) return NextResponse.json({ connected: false, error: ig.error, platforms: [] }, { status: 200 });
    return NextResponse.json({ connected: true, platforms: [ig] });
  } catch (e) {
    return NextResponse.json(
      { connected: false, error: `API bilan bog'lanib bo'lmadi: ${e.message}`, platforms: [] },
      { status: 200 }
    );
  }
}
