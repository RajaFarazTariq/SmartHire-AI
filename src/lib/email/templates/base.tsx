import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

export type BaseEmailProps = {
  preview: string;
  heading: string;
  body: React.ReactNode;
  ctaLabel?: string;
  ctaUrl?: string | null;
  unsubscribeUrl?: string | null;
  managePreferencesUrl?: string | null;
};

export function BaseEmail({
  preview,
  heading,
  body,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
  managePreferencesUrl,
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg border border-slate-200 bg-white p-8">
            <Section>
              <Text className="m-0 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                SmartHire-AI
              </Text>
              <Text className="mt-3 text-xl font-semibold text-slate-900">
                {heading}
              </Text>
              <div className="mt-3 text-sm leading-6 text-slate-700">
                {body}
              </div>
              {ctaLabel && ctaUrl && (
                <Section className="mt-6">
                  <Button
                    href={ctaUrl}
                    className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    {ctaLabel}
                  </Button>
                </Section>
              )}
            </Section>
            <Hr className="my-6 border-slate-200" />
            <Text className="m-0 text-xs leading-5 text-slate-500">
              You&apos;re getting this because you have an account on
              SmartHire-AI.
              {managePreferencesUrl && (
                <>
                  {" "}
                  <Link
                    href={managePreferencesUrl}
                    className="text-slate-600 underline"
                  >
                    Manage notification preferences
                  </Link>
                  .
                </>
              )}
              {unsubscribeUrl && (
                <>
                  {" "}
                  <Link
                    href={unsubscribeUrl}
                    className="text-slate-600 underline"
                  >
                    Unsubscribe
                  </Link>
                  .
                </>
              )}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
