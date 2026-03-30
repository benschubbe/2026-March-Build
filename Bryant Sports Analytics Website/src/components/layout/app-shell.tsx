import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area offset by sidebar width */}
      <div className="ml-64 flex flex-1 flex-col">
        <Topbar pageTitle={pageTitle} />

        <main className="flex-1 overflow-y-auto bg-bryant-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
