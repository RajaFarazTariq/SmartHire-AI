import { OrganizationProfile } from "@clerk/nextjs";

import { PageHeader } from "@/components/dashboard/page-header";

export default function OrganizationPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Organization"
        description="Manage your organization profile, logo, members, roles, and invitations."
      />
      <OrganizationProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full max-w-none shadow-none border border-border",
          },
        }}
      />
    </div>
  );
}
