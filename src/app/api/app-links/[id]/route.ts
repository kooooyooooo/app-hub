import { NextResponse } from "next/server";
import { serializeAppLink, validateAppLinkInput } from "@/lib/app-links";
import { requireApiAuth, routeErrorResponse } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;
  const result = validateAppLinkInput(body, { partial: true });

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  try {
    const appLink = await getPrisma().appLink.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ appLink: serializeAppLink(appLink) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const unauthorized = await requireApiAuth();

  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  try {
    await getPrisma().appLink.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
