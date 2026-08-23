"use client";

import { useState } from "react";

const PLACEHOLDER_CHANNELS = [
  {
    id: "max",
    label: "MAX",
    icon: "/assets/icons/max-official.svg"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "/assets/icons/whatsapp-official.svg"
  },
  {
    id: "vk",
    label: "ВКонтакте",
    icon: "/assets/icons/vk-official.svg"
  }
] as const;

type ChannelId = (typeof PLACEHOLDER_CHANNELS)[number]["id"];

export function SocialPlaceholderButtons() {
  const [activeChannel, setActiveChannel] = useState<ChannelId | null>(null);
  const activeLabel = PLACEHOLDER_CHANNELS.find(
    (channel) => channel.id === activeChannel
  )?.label;

  return (
    <>
      {PLACEHOLDER_CHANNELS.map((channel) => (
        <button
          aria-label={`${channel.label}: интеграция в разработке`}
          className={`social-channel social-channel-placeholder social-channel-${channel.id}${
            activeChannel === channel.id ? " is-active" : ""
          }`}
          key={channel.id}
          onClick={() => setActiveChannel(channel.id)}
          type="button"
        >
          <span className="social-channel-icon" aria-hidden="true">
            <img
              alt=""
              decoding="async"
              draggable="false"
              height={34}
              src={channel.icon}
              width={34}
            />
          </span>
          <span className="social-channel-copy">
            <strong>{channel.label}</strong>
            <small>Скоро</small>
          </span>
        </button>
      ))}

      {activeLabel ? (
        <p
          aria-atomic="true"
          aria-live="polite"
          className="social-placeholder-status"
          role="status"
        >
          <strong>{activeLabel}</strong>
          <span>Скоро подключим — интеграция уже в разработке.</span>
        </p>
      ) : null}
    </>
  );
}
