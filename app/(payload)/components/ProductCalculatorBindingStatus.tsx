"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormFields } from "@payloadcms/ui";
import { Calculator, CheckCircle2, CircleAlert } from "lucide-react";
import "./product-editor.scss";

type FormState = Record<string, { value?: unknown }>;

type CalculatorProfileResponse = {
  title?: unknown;
};

function relationId(value: unknown): string | number | undefined {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!value || typeof value !== "object") return undefined;
  const object = value as { id?: unknown; value?: unknown };
  if (typeof object.id === "string" || typeof object.id === "number") {
    return object.id;
  }
  if (object.value !== undefined && object.value !== value) {
    return relationId(object.value);
  }
  return undefined;
}

function relationTitle(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const object = value as { title?: unknown; value?: unknown };
  if (typeof object.title === "string" && object.title.trim()) {
    return object.title.trim();
  }
  if (object.value !== undefined && object.value !== value) {
    return relationTitle(object.value);
  }
  return undefined;
}

export function ProductCalculatorBindingStatus() {
  const binding = useFormFields(([fields]) => {
    const state = fields as FormState;
    return {
      pageMode: state.pageMode?.value,
      profile: state.calculatorProfile?.value
    };
  });
  const profileId = useMemo(() => relationId(binding.profile), [binding.profile]);
  const embeddedTitle = useMemo(
    () => relationTitle(binding.profile),
    [binding.profile]
  );
  const [resolvedTitle, setResolvedTitle] = useState<string>();

  useEffect(() => {
    setResolvedTitle(undefined);
    if (binding.pageMode !== "configurator" || !profileId || embeddedTitle) {
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/calculator-profiles/${encodeURIComponent(profileId)}`, {
      credentials: "same-origin",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const body = (await response.json()) as CalculatorProfileResponse;
        return typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : undefined;
      })
      .then((title) => setResolvedTitle(title))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResolvedTitle(undefined);
        }
      });

    return () => controller.abort();
  }, [binding.pageMode, embeddedTitle, profileId]);

  if (binding.pageMode !== "configurator") {
    return (
      <section className="product-calculator-binding" data-state="standard">
        <Calculator size={20} aria-hidden />
        <div>
          <strong>На странице товара нет калькулятора</strong>
          <span>Клиент увидит обычную форму заявки на инженерный расчёт.</span>
        </div>
      </section>
    );
  }

  const title = embeddedTitle ?? resolvedTitle;
  if (!profileId) {
    return (
      <section className="product-calculator-binding" data-state="warning">
        <CircleAlert size={20} aria-hidden />
        <div>
          <strong>Калькулятор не выбран</strong>
          <span>Выберите профиль выше, иначе товар нельзя корректно сохранить.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="product-calculator-binding" data-state="configured">
      <CheckCircle2 size={20} aria-hidden />
      <div>
        <strong>На товаре подключён калькулятор</strong>
        <span>{title ?? "Загружаем название профиля…"}</span>
      </div>
    </section>
  );
}
