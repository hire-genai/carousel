import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

interface OrgAcl {
  organization: string; // "urn:li:organization:12345"
  state: string;
  role: string;
}

interface OrgAclResponse {
  elements: OrgAcl[];
}

interface OrgDetails {
  id: number;
  localizedName: string;
}

export interface LinkedInPage {
  urn: string;
  name: string;
  id: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.linkedinAccount) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const { accessToken } = user.linkedinAccount;

    // Fetch pages where user is admin
    const aclRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (!aclRes.ok) {
      // Scope not granted or no pages — return empty list gracefully
      return NextResponse.json({ pages: [] });
    }

    const aclData: OrgAclResponse = await aclRes.json();
    const orgUrns = (aclData.elements ?? []).map((el) => el.organization);

    if (orgUrns.length === 0) {
      return NextResponse.json({ pages: [] });
    }

    // Fetch org names in parallel
    const pages = await Promise.all(
      orgUrns.map(async (urn): Promise<LinkedInPage | null> => {
        const orgId = urn.split(":").pop();
        if (!orgId) return null;

        try {
          const orgRes = await fetch(
            `https://api.linkedin.com/v2/organizations/${orgId}?projection=(id,localizedName)`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Restli-Protocol-Version": "2.0.0",
              },
            }
          );

          if (!orgRes.ok) return null;

          const org: OrgDetails = await orgRes.json();
          return {
            urn: `urn:li:organization:${orgId}`,
            name: org.localizedName ?? `Page ${orgId}`,
            id: orgId,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({ pages: pages.filter(Boolean) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("GET /api/linkedin/pages error:", message);
    return NextResponse.json({ pages: [] });
  }
}
