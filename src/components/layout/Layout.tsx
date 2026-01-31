import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex min-h-full">
          {/* Sidebar as direct flex item for proper stretching */}
          <Sidebar className="hidden md:flex" />
          <main className="flex-1 p-3 md:p-4 xl:p-6 w-full min-w-0">
            <div className="mx-auto w-full max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
