export const APP_LINK_STATUSES = [
  "active",
  "testing",
  "idea",
  "archived",
] as const;

export type AppLinkStatus = (typeof APP_LINK_STATUSES)[number];

export type AppLinkDto = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  status: AppLinkStatus;
  icon: string | null;
  memo: string | null;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AppLinkRecord = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  status: string;
  icon: string | null;
  memo: string | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AppLinkMutationInput = {
  name?: string;
  url?: string;
  description?: string | null;
  category?: string | null;
  status?: AppLinkStatus;
  icon?: string | null;
  memo?: string | null;
  sortOrder?: number | null;
};

type ValidationResult =
  | {
      ok: true;
      data: AppLinkMutationInput;
    }
  | {
      ok: false;
      errors: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];

  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim();
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  const value = record[key];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readSortOrder(record: Record<string, unknown>): number | null | undefined {
  const raw = hasOwn(record, "sortOrder")
    ? record.sortOrder
    : record.sort_order;

  if (raw === undefined) {
    return undefined;
  }

  if (raw === null || raw === "") {
    return null;
  }

  if (typeof raw === "number" && Number.isInteger(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeStatus(value: string | undefined): AppLinkStatus | null {
  if (!value) {
    return null;
  }

  return APP_LINK_STATUSES.includes(value as AppLinkStatus)
    ? (value as AppLinkStatus)
    : null;
}

export function validateAppLinkInput(
  value: unknown,
  options: { partial?: boolean } = {},
): ValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ["入力内容を読み取れませんでした。"] };
  }

  const errors: string[] = [];
  const data: AppLinkMutationInput = {};
  const partial = options.partial ?? false;
  let touched = false;

  if (hasOwn(value, "name") || !partial) {
    touched = true;
    const name = readString(value, "name");

    if (!name) {
      errors.push("アプリ名を入力してください。");
    } else {
      data.name = name;
    }
  }

  if (hasOwn(value, "url") || !partial) {
    touched = true;
    const rawUrl = readString(value, "url");
    const url = rawUrl ? normalizeUrl(rawUrl) : null;

    if (!url) {
      errors.push("URLはhttpまたはhttpsで始まる正しい形式で入力してください。");
    } else {
      data.url = url;
    }
  }

  for (const key of ["description", "category", "icon", "memo"] as const) {
    const parsed = readNullableString(value, key);

    if (parsed !== undefined) {
      touched = true;
      data[key] = parsed;
    }
  }

  if (hasOwn(value, "status") || !partial) {
    touched = true;
    const rawStatus = readString(value, "status");
    const status = normalizeStatus(rawStatus);

    if (!status) {
      if (!rawStatus) {
        data.status = "active";
      } else {
        errors.push("ステータスの値が不正です。");
      }
    } else {
      data.status = status;
    }
  }

  if (hasOwn(value, "sortOrder") || hasOwn(value, "sort_order")) {
    touched = true;
    const sortOrder = readSortOrder(value);

    if (sortOrder === undefined) {
      errors.push("表示順は整数で入力してください。");
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if (partial && !touched) {
    errors.push("更新する項目がありません。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function normalizeStatusForOutput(status: string): AppLinkStatus {
  return APP_LINK_STATUSES.includes(status as AppLinkStatus)
    ? (status as AppLinkStatus)
    : "active";
}

export function serializeAppLink(link: AppLinkRecord): AppLinkDto {
  return {
    id: link.id,
    name: link.name,
    url: link.url,
    description: link.description,
    category: link.category,
    status: normalizeStatusForOutput(link.status),
    icon: link.icon,
    memo: link.memo,
    sortOrder: link.sortOrder,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function sortAppLinks<T extends AppLinkRecord>(links: T[]): T[] {
  return [...links].sort((left, right) => {
    if (left.sortOrder !== null && right.sortOrder !== null) {
      return left.sortOrder - right.sortOrder;
    }

    if (left.sortOrder !== null) {
      return -1;
    }

    if (right.sortOrder !== null) {
      return 1;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}
