"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { AppLinkDto, AppLinkStatus } from "@/lib/app-links";

type FormState = {
  name: string;
  url: string;
  description: string;
  category: string;
  status: AppLinkStatus;
  icon: string;
  memo: string;
  sortOrder: string;
};

type Notice = {
  type: "success" | "error";
  text: string;
};

const statusLabels: Record<AppLinkStatus, string> = {
  active: "稼働中",
  testing: "テスト中",
  idea: "構想中",
  archived: "保管",
};

const statusOptions: Array<{ value: AppLinkStatus; label: string }> = [
  { value: "active", label: statusLabels.active },
  { value: "testing", label: statusLabels.testing },
  { value: "idea", label: statusLabels.idea },
  { value: "archived", label: statusLabels.archived },
];

const emptyFormState: FormState = {
  name: "",
  url: "",
  description: "",
  category: "",
  status: "active",
  icon: "",
  memo: "",
  sortOrder: "",
};

function toFormState(link: AppLinkDto): FormState {
  return {
    name: link.name,
    url: link.url,
    description: link.description ?? "",
    category: link.category ?? "",
    status: link.status,
    icon: link.icon ?? "",
    memo: link.memo ?? "",
    sortOrder: link.sortOrder === null ? "" : String(link.sortOrder),
  };
}

function toPayload(form: FormState) {
  return {
    name: form.name,
    url: form.url,
    description: form.description,
    category: form.category,
    status: form.status,
    icon: form.icon,
    memo: form.memo,
    sortOrder: form.sortOrder === "" ? null : Number(form.sortOrder),
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string; errors?: string[] }
    | null;

  if (body?.errors?.length) {
    return body.errors.join("\n");
  }

  return body?.error ?? "処理に失敗しました。";
}

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function sortAppLinkDtos(links: AppLinkDto[]): AppLinkDto[] {
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

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

export function AppHub() {
  const [appLinks, setAppLinks] = useState<AppLinkDto[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingLink, setEditingLink] = useState<AppLinkDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [deleteTarget, setDeleteTarget] = useState<AppLinkDto | null>(null);

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/app-links", {
        cache: "no-store",
      });

      if (!response.ok) {
        setNotice({ type: "error", text: await readError(response) });
        return;
      }

      const body = (await response.json()) as { appLinks: AppLinkDto[] };
      setAppLinks(sortAppLinkDtos(body.appLinks));
    } catch {
      setNotice({
        type: "error",
        text: "データ取得に失敗しました。再読み込みしてください。",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return appLinks;
    }

    return appLinks.filter((link) =>
      [
        link.name,
        link.url,
        link.description,
        link.category,
        link.memo,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [appLinks, search]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setEditingLink(null);
    setForm(emptyFormState);
    setFormMode("create");
    setNotice(null);
  }

  function openEditForm(link: AppLinkDto, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setEditingLink(link);
    setForm(toFormState(link));
    setFormMode("edit");
    setNotice(null);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setFormMode(null);
    setEditingLink(null);
    setForm(emptyFormState);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);

    const isEdit = formMode === "edit" && editingLink !== null;
    const endpoint = isEdit
      ? `/api/app-links/${editingLink.id}`
      : "/api/app-links";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toPayload(form)),
      });

      if (!response.ok) {
        setNotice({ type: "error", text: await readError(response) });
        return;
      }

      const body = (await response.json()) as { appLink: AppLinkDto };

      setAppLinks((current) => {
        if (!isEdit) {
          return sortAppLinkDtos([body.appLink, ...current]);
        }

        return sortAppLinkDtos(
          current.map((link) =>
            link.id === body.appLink.id ? body.appLink : link,
          ),
        );
      });
      setNotice({
        type: "success",
        text: isEdit ? "アプリリンクを更新しました。" : "アプリリンクを追加しました。",
      });
      closeForm();
    } catch {
      setNotice({
        type: "error",
        text: "保存に失敗しました。再試行してください。",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/app-links/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setNotice({
          type: "error",
          text: `${await readError(response)} 削除は完了していません。`,
        });
        return;
      }

      setAppLinks((current) =>
        current.filter((link) => link.id !== deleteTarget.id),
      );
      setNotice({ type: "success", text: "アプリリンクを削除しました。" });
      setDeleteTarget(null);
    } catch {
      setNotice({
        type: "error",
        text: "削除に失敗しました。対象は削除されていません。",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    link: AppLinkDto,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openExternalUrl(link.url);
    }
  }

  return (
    <main className="hub-shell">
      <header className="hub-hero">
        <div className="hero-copy">
          <p className="eyebrow">Personal Command Center</p>
          <h1>App Hub</h1>
          <p className="hero-subtitle">Dive into your personal apps.</p>
        </div>

        <div className="hero-actions">
          <button className="ghost-button" type="button" onClick={handleLogout}>
            ログアウト
          </button>
          <button className="primary-button" type="button" onClick={openCreateForm}>
            ＋ 追加
          </button>
        </div>
      </header>

      <section className="hub-toolbar" aria-label="アプリ検索">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="アプリ名、URL、カテゴリで検索"
            type="search"
          />
        </label>
        <p className="app-count">{filteredLinks.length} apps</p>
      </section>

      {notice ? (
        <p className={`notice ${notice.type}`} role="status">
          {notice.text}
        </p>
      ) : null}

      {isLoading ? (
        <section className="loading-state" aria-label="読み込み中">
          <span />
          <span />
          <span />
        </section>
      ) : filteredLinks.length === 0 ? (
        <section className="empty-state">
          <h2>まだアプリが登録されていません。</h2>
          <p>最初のアプリリンクを追加しましょう。</p>
          <button className="primary-button" type="button" onClick={openCreateForm}>
            アプリを追加する
          </button>
        </section>
      ) : (
        <section className="app-grid" aria-label="登録済みアプリ">
          {filteredLinks.map((link) => (
            <article
              className={`app-card status-${link.status}`}
              key={link.id}
              onClick={() => openExternalUrl(link.url)}
              onKeyDown={(event) => handleCardKeyDown(event, link)}
              role="link"
              tabIndex={0}
            >
              <div className="card-head">
                <div className="app-icon" aria-hidden="true">
                  {link.icon || "◇"}
                </div>
                <div className="card-kicker">
                  <span>{link.category || "Uncategorized"}</span>
                  <time dateTime={link.updatedAt}>{formatDate(link.updatedAt)}</time>
                </div>
              </div>

              <h2>{link.name}</h2>
              <p className="card-description">
                {link.description || "説明未設定"}
              </p>
              <p className="card-url">{link.url}</p>

              <div className="card-meta">
                <span className={`status-pill ${link.status}`}>
                  {statusLabels[link.status]}
                </span>
                {link.sortOrder !== null ? (
                  <span className="sort-pill">#{link.sortOrder}</span>
                ) : null}
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openExternalUrl(link.url);
                  }}
                >
                  開く
                </button>
                <button
                  type="button"
                  onClick={(event) => openEditForm(link, event)}
                >
                  編集
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteTarget(link);
                  }}
                >
                  削除
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="hub-footer">App Hub</footer>

      {formMode ? (
        <div className="modal-backdrop" onMouseDown={closeForm}>
          <section
            aria-labelledby="app-link-form-title"
            aria-modal="true"
            className="modal-panel"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">App Link</p>
                <h2 id="app-link-form-title">
                  {formMode === "edit" ? "アプリを編集" : "アプリを追加"}
                </h2>
              </div>
              <button
                aria-label="閉じる"
                className="icon-button"
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form className="link-form" onSubmit={handleSubmit}>
              <label>
                アプリ名
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </label>

              <label>
                URL
                <input
                  required
                  inputMode="url"
                  value={form.url}
                  onChange={(event) => updateForm("url", event.target.value)}
                  placeholder="https://example.com"
                />
              </label>

              <label>
                説明文
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </label>

              <div className="form-grid">
                <label>
                  カテゴリ
                  <input
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="AI"
                  />
                </label>

                <label>
                  ステータス
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value as AppLinkStatus)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  アイコン
                  <input
                    value={form.icon}
                    onChange={(event) => updateForm("icon", event.target.value)}
                    placeholder="💠"
                  />
                </label>

                <label>
                  表示順
                  <input
                    min="0"
                    step="1"
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateForm("sortOrder", event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                メモ
                <textarea
                  rows={3}
                  value={form.memo}
                  onChange={(event) => updateForm("memo", event.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={closeForm}>
                  キャンセル
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="modal-backdrop"
          onMouseDown={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            aria-labelledby="delete-title"
            aria-modal="true"
            className="modal-panel delete-panel"
            onMouseDown={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <p className="eyebrow">Delete</p>
            <h2 id="delete-title">このアプリリンクを削除しますか？</h2>
            <p className="delete-target">{deleteTarget.name}</p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                className="danger-solid-button"
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
