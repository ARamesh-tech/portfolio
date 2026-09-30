import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/login?error=AccessDenied&callbackUrl=/admin");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent-strong uppercase">Admin console</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Welcome back, {session.user.name?.split(" ")[0] ?? "Ramesh"}.</h1>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
