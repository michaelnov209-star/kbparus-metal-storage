"use client";

import { useField } from "@payloadcms/ui";
import type { KeyboardEvent } from "react";
import type {
  DefaultCellComponentProps,
  SelectFieldClient,
  SelectFieldClientProps,
  TextFieldClient
} from "payload";

import {
  avatarPresetLabels,
  avatarPresetMeta,
  avatarPresetValues,
  normalizeAvatarPreset
} from "@/payload/admin/avatar-presets";
import { AdminUserAvatar } from "./AdminUserAvatar";
import "./avatar-preset-field.scss";

export function AvatarPresetCell({
  cellData,
  rowData
}: DefaultCellComponentProps<SelectFieldClient>) {
  const preset = normalizeAvatarPreset(cellData);
  const name =
    typeof rowData.displayName === "string"
      ? rowData.displayName
      : typeof rowData.email === "string"
        ? rowData.email
        : avatarPresetLabels[preset];

  return (
    <span
      className="kb-avatar-field__cell"
      title={name}
    >
      <AdminUserAvatar name={name} preset={preset} size={44} />
    </span>
  );
}

export function UserDisplayNameCell({
  cellData,
  rowData
}: DefaultCellComponentProps<TextFieldClient>) {
  const displayName =
    typeof cellData === "string" && cellData.trim()
      ? cellData.trim()
      : typeof rowData.email === "string"
        ? rowData.email
        : "Имя не указано";
  const position =
    typeof rowData.position === "string" && rowData.position.trim()
      ? rowData.position.trim()
      : "Должность не указана";

  return (
    <span className="kb-user-name-cell">
      <strong>{displayName}</strong>
      <small>{position}</small>
    </span>
  );
}

export function AvatarPresetField({
  field,
  path: pathFromProps,
  readOnly
}: SelectFieldClientProps) {
  const {
    disabled,
    errorMessage,
    path,
    setValue,
    showError,
    value
  } = useField<string>({ potentiallyStalePath: pathFromProps });
  const selected = normalizeAvatarPreset(value);
  const selectedMeta =
    selected === "system"
      ? { animal: "Системный профиль", role: "Автоматическое изменение" }
      : avatarPresetMeta[selected];
  const locked = Boolean(readOnly || disabled);
  const labelId = `${path.replaceAll(".", "-")}-label`;
  const descriptionId = `${path.replaceAll(".", "-")}-description`;
  const errorId = `${path.replaceAll(".", "-")}-error`;

  function selectPreset(next: string) {
    if (!locked) setValue(next);
  }

  function moveSelection(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const direction = {
      ArrowDown: 4,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -4
    }[event.key] ?? 0;
    const nextIndex =
      (currentIndex + direction + avatarPresetValues.length * 2) %
      avatarPresetValues.length;
    const next = avatarPresetValues[nextIndex];
    selectPreset(next);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]'
    );
    buttons?.[nextIndex]?.focus();
  }

  return (
    <div className="kb-avatar-field" data-read-only={locked || undefined}>
      <div className="kb-avatar-field__heading">
        <div>
          <span className="kb-avatar-field__label" id={labelId}>
            {typeof field.label === "string" ? field.label : "Аватар профиля"}
            {field.required ? <b aria-hidden> *</b> : null}
          </span>
          <p id={descriptionId}>
            Выберите своего персонажа из команды производства КБ Парус.
          </p>
        </div>
        <div className="kb-avatar-field__preview" aria-live="polite">
          <AdminUserAvatar
            label={`Выбран аватар «${avatarPresetLabels[selected]}»`}
            preset={selected}
            size={112}
          />
          <span>
            <small>Выбран</small>
            <strong>{selectedMeta.animal}</strong>
            <em>{selectedMeta.role}</em>
          </span>
        </div>
      </div>

      <div
        aria-describedby={
          showError && errorMessage
            ? `${descriptionId} ${errorId}`
            : descriptionId
        }
        aria-invalid={showError && errorMessage ? true : undefined}
        aria-labelledby={labelId}
        aria-required={field.required || undefined}
        className="kb-avatar-field__grid"
        role="radiogroup"
      >
        {avatarPresetValues.map((preset, index) => {
          const active = preset === selected;
          const meta = avatarPresetMeta[preset];
          return (
            <button
              aria-checked={active}
              disabled={locked}
              key={preset}
              onClick={() => selectPreset(preset)}
              onKeyDown={(event) => moveSelection(event, index)}
              role="radio"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              <AdminUserAvatar preset={preset} size={96} />
              <span className="kb-avatar-field__option-copy">
                <strong>{meta.animal}</strong>
                <small>{meta.role}</small>
              </span>
              <i aria-hidden />
            </button>
          );
        })}
      </div>

      {showError && errorMessage ? (
        <p className="kb-avatar-field__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
