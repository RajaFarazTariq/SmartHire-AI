import { requireDbUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDbUser();

  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 p-4">
        <nav>
          <p className="text-sm text-gray-600">Signed in as</p>
          <p className="font-medium truncate">{user.email}</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
