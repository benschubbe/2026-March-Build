import React from "react";

export interface TabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  activeTab,
  onTabChange,
  children,
  className = "",
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab, onTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsContextValue {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  activeTab: "",
  onTabChange: () => {},
});

function useTabsContext() {
  return React.useContext(TabsContext);
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className = "" }: TabListProps) {
  return (
    <div
      className={`flex border-b border-bryant-gray-200 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Tab({ value, children, className = "" }: TabProps) {
  const { activeTab, onTabChange } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onTabChange(value)}
      className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
        isActive
          ? "border-b-2 border-bryant-gold text-bryant-gold"
          : "text-bryant-gray-500 hover:text-bryant-gray-700 hover:border-b-2 hover:border-bryant-gray-300"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className={`py-4 ${className}`}>
      {children}
    </div>
  );
}
