import * as React from "react";
import { Text } from "@react-email/components";

import { BaseEmail } from "./base";

export type GenericEmailProps = {
  heading: string;
  preview: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string | null;
  unsubscribeUrl?: string | null;
  managePreferencesUrl?: string | null;
};

/** Default template — used by every notification.type unless a richer one exists. */
export function GenericNotificationEmail({
  heading,
  preview,
  paragraphs,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
  managePreferencesUrl,
}: GenericEmailProps) {
  return (
    <BaseEmail
      preview={preview}
      heading={heading}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      unsubscribeUrl={unsubscribeUrl}
      managePreferencesUrl={managePreferencesUrl}
      body={
        <>
          {paragraphs.map((p, i) => (
            <Text
              key={i}
              className="my-2 text-sm leading-6 text-slate-700"
            >
              {p}
            </Text>
          ))}
        </>
      }
    />
  );
}
