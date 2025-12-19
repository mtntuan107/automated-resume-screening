// app/(main)/layout.tsx
import Header from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function MainLayout({
  children, // children ở đây chính là các page bên trong (main)
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar cố định */}
      <aside className="hidden w-64 border-r bg-gray-100/40 md:block overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Content bên phải */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6">
           <Header />
        </header>

        {/* Nội dung thay đổi (Page) */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}