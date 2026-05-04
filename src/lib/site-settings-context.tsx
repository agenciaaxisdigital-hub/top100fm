import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings } from "@/lib/admin-api";

type Settings = Record<string, any>;

type SiteSettingsContextType = {
  settings: Settings | undefined;
  isLoading: boolean;
  update: (key: string, value: any) => Promise<void>;
  refetch: () => void;
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<Settings>({
    queryKey: ["siteSettings"],
    queryFn: async () => {
      try {
        const res = await getSiteSettings();
        return res as Settings;
      } catch (e) {
        console.warn("Failed to load settings:", e);
        return {};
      }
    }
  });

  const mutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });

  const update = async (key: string, value: any) => {
    await mutation.mutateAsync({ data: { key, value } } as any);
  };

  return (
    <SiteSettingsContext.Provider value={{ settings: data, isLoading, update, refetch }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}
