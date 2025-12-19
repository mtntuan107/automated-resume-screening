// components/layout/header.tsx
import { MobileSidebar } from "./mobile-sidebar";

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <MobileSidebar />
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/candidate">
            <span className="hidden font-bold sm:inline-block">
              Automation Resume Screening System
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center">
             
          </nav>
        </div>
      </div>
    </header>
  );
}