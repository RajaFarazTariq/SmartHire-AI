import * as React from "react";

import { GenericNotificationEmail } from "./generic";

export type RenderArgs = {
  title: string;
  body: string | null;
  ctaUrl: string | null;
  unsubscribeUrl: string | null;
  managePreferencesUrl: string | null;
};

export type Rendered = {
  subject: string;
  element: React.ReactElement;
};

type Renderer = (args: RenderArgs) => Rendered | null;

/**
 * Per-type renderer. Returning null means "do not email this notification.type"
 * — keep the in-app notification, skip the outbound. New types must be added
 * here explicitly so we never email a type we didn't think about.
 */
const RENDERERS: Record<string, Renderer> = {
  "application.status": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your application status has been updated.",
          "Open your application to see the latest details.",
        ]}
        ctaLabel="View application"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "application.submitted": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "We received your application — thanks for applying.",
          "We'll let you know as soon as the recruiter reviews it.",
        ]}
        ctaLabel="Track application"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "interview.scheduled": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your interview has been scheduled.",
          "Add it to your calendar and check the application page for the meeting link.",
        ]}
        ctaLabel="View interview"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "interview.panel_assigned": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "You've been added to an interview panel.",
          "Open the candidate to view the interview details, generate AI questions, and submit your scorecard.",
        ]}
        ctaLabel="View candidate"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "interview.link": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your interview now has a meeting link.",
          "Open your application page to find the link and a Join button.",
        ]}
        ctaLabel="Open application"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "interview.reminder": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Heads up — your interview is coming up.",
          "Open your application page for the meeting link and details.",
        ]}
        ctaLabel="Open application"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "note.mention": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "A teammate mentioned you in a note.",
          "Open the candidate to see the full thread.",
        ]}
        ctaLabel="View note"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.request": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Someone has asked to join your organization.",
          "Review the request and approve or decline it.",
        ]}
        ctaLabel="Review request"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.request.approved": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your request to join the organization was approved.",
          "You can now sign in and access the workspace.",
        ]}
        ctaLabel="Open dashboard"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.request.rejected": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your request to join the organization was not approved.",
          "If you believe this was a mistake, reach out to the org admin directly.",
        ]}
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.role.promoted": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your role in the organization has been promoted.",
          "Open the workspace to see what's newly accessible to you.",
        ]}
        ctaLabel="Open organization"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.role.demoted": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "Your role in the organization has changed.",
          "If this was unexpected, contact the organization admin.",
        ]}
        ctaLabel="Open organization"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.role.changed": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[body ?? "Your role in the organization changed."]}
        ctaLabel="Open organization"
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.member.removed": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "You were removed from an organization.",
          "If this was a mistake, please contact the organization admin.",
        ]}
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
  "org.deleted": ({ title, body, ctaUrl, unsubscribeUrl, managePreferencesUrl }) => ({
    subject: title,
    element: (
      <GenericNotificationEmail
        heading={title}
        preview={body ?? title}
        paragraphs={[
          body ?? "An organization you were part of has been deleted.",
          "Any jobs, candidates and interviews in that workspace have been permanently removed.",
        ]}
        ctaUrl={ctaUrl}
        unsubscribeUrl={unsubscribeUrl}
        managePreferencesUrl={managePreferencesUrl}
      />
    ),
  }),
};

export function renderEmailFor(type: string, args: RenderArgs): Rendered | null {
  const fn = RENDERERS[type];
  if (!fn) return null;
  return fn(args);
}
