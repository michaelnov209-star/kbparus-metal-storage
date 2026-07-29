"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSafeAdminRedirect } from "./redirect";

function currentAdminRedirect(): string {
  const requestedPath = new URLSearchParams(window.location.search).get("redirect");
  return getSafeAdminRedirect(requestedPath, window.location.origin);
}

function loginErrorMessage(status: number): string {
  if (status === 429) {
    return "Слишком много попыток входа. Подождите немного и попробуйте снова.";
  }

  if (status >= 500) {
    return "Сервис временно недоступен. Повторите попытку через минуту.";
  }

  return "Не удалось войти. Проверьте email и пароль.";
}

export function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/users/me?depth=0", {
          cache: "no-store",
          credentials: "include",
          headers: { "Accept-Language": "ru" },
          signal: controller.signal
        });

        if (!response.ok) return;

        const data = (await response.json()) as { user?: unknown };
        if (data.user) {
          window.location.replace(currentAdminRedirect());
        }
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
      }
    }

    void checkSession();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? email).trim();
    const submittedPassword = String(formData.get("password") ?? password);

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Accept-Language": "ru",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: submittedEmail,
          password: submittedPassword
        })
      });

      if (!response.ok) {
        setError(loginErrorMessage(response.status));
        return;
      }

      window.location.replace(currentAdminRedirect());
    } catch {
      setError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="kb-auth-shell">
      <aside className="kb-auth-showcase" aria-label="Возможности панели управления">
        <div className="kb-auth-showcase__grid" aria-hidden="true" />
        <div className="kb-auth-brand kb-auth-brand--inverse">
          <img src="/brand/logo-g.png" alt="" width="118" height="39" />
          <span>
            <strong>КБ Парус</strong>
            <small>Панель управления сайтом</small>
          </span>
        </div>

        <div className="kb-auth-showcase__content">
          <span className="kb-auth-kicker">Единое рабочее пространство</span>
          <h2>Сайт, заявки и аналитика — под контролем</h2>
          <p>
            Управляйте каталогом, контентом и обращениями клиентов в одном месте.
          </p>
          <div className="kb-auth-capabilities" aria-label="Разделы системы">
            <span>Каталог</span>
            <span>Заявки</span>
            <span>SEO и аналитика</span>
          </div>
        </div>

        <p className="kb-auth-showcase__footer">
          Производственные системы хранения металла
        </p>
      </aside>

      <main className="kb-auth-main">
        <div className="kb-auth-card">
          <div className="kb-auth-brand kb-auth-brand--mobile">
            <img src="/brand/logo-g.png" alt="" width="104" height="35" />
            <span>
              <strong>КБ Парус</strong>
              <small>Панель управления сайтом</small>
            </span>
          </div>

          <div className="kb-auth-card__heading">
            <span className="kb-auth-secure">
              <i aria-hidden="true" />
              Защищённая зона
            </span>
            <h1>Вход в панель управления</h1>
            <p>Введите рабочие данные для доступа к сайту.</p>
          </div>

          <form className="kb-auth-form" onSubmit={handleSubmit}>
            <div className="kb-auth-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="name@company.ru"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="kb-auth-field">
              <label htmlFor="admin-password">Пароль</label>
              <div className="kb-auth-password">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Введите пароль…"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error" : undefined}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="kb-auth-password__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? "Скрыть" : "Показать"}
                </button>
              </div>
            </div>

            <div
              id="login-error"
              className={`kb-auth-error${error ? " kb-auth-error--visible" : ""}`}
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>

            <button
              className="kb-auth-submit"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="kb-auth-spinner" aria-hidden="true" />
                  Проверяем данные…
                </>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <p className="kb-auth-support">
            Нет доступа? Обратитесь к администратору сайта.
          </p>
        </div>

        <p className="kb-auth-legal">
          Доступ только для сотрудников. Все действия защищены авторизацией.
        </p>
      </main>
    </div>
  );
}
