import { NextResponse } from "next/server";
import {
  serializeAppLink,
  sortAppLinks,
  validateAppLinkInput,
} from "@/lib/app-links";
import { requireApiAuth, routeErrorResponse } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const appLinks = await getPrisma().appLink.findMany();

    return NextResponse.json({
      appLinks: sortAppLinks(appLinks).map(serializeAppLink),
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const result = validateAppLinkInput(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  if (!result.data.name || !result.data.url) {
    return NextResponse.json(
      { errors: ["アプリ名とURLを入力してください。"] },
      { status: 400 },
    );
  }

  try {
    const appLink = await getPrisma().appLink.create({
      data: {
        name: result.data.name,
        url: result.data.url,
        description: result.data.description,
        category: result.data.category,
        status: result.data.status ?? "active",
        icon: result.data.icon,
        memo: result.data.memo,
        sortOrder: result.data.sortOrder,
      },
    });

    return NextResponse.json(
      { appLink: serializeAppLink(appLink) },
      { status: 201 },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
