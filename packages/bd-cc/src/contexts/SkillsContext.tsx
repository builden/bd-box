import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authenticatedFetch } from "../utils/api";

export type Skill = {
  name: string;
  displayName: string;
  description: string;
  allowedTools: string;
  enabled: boolean;
  dirName: string;
  repoUrl: string | null;
  isSymlink: boolean;
  sourcePath: string | null;
};

type SkillsContextValue = {
  skills: Skill[];
  loading: boolean;
  skillsError: string | null;
  refreshSkills: () => Promise<void>;
  installSkill: (url: string) => Promise<{ success: boolean; error?: string }>;
  uninstallSkill: (name: string) => Promise<{ success: boolean; error?: string }>;
  updateSkill: (name: string) => Promise<{ success: boolean; error?: string }>;
  toggleSkill: (name: string, enabled: boolean) => Promise<{ success: boolean; error: string | null }>;
};

const SkillsContext = createContext<SkillsContextValue | null>(null);

export function useSkills() {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error("useSkills must be used within a SkillsProvider");
  }
  return context;
}

export function SkillsProvider({ children }: { children: ReactNode }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const refreshSkills = useCallback(async () => {
    try {
      const res = await authenticatedFetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        setSkillsError(null);
      } else {
        let errorMessage = `Failed to fetch skills (${res.status})`;
        try {
          const data = await res.json();
          errorMessage = data.details || data.error || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        setSkillsError(errorMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch skills";
      setSkillsError(message);
      console.error("[Skills] Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSkills();
  }, [refreshSkills]);

  const installSkill = useCallback(
    async (url: string) => {
      try {
        const res = await authenticatedFetch("/api/skills/install", {
          method: "POST",
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || "Install failed" };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Install failed" };
      }
    },
    [refreshSkills],
  );

  const uninstallSkill = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || "Uninstall failed" };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Uninstall failed" };
      }
    },
    [refreshSkills],
  );

  const updateSkill = useCallback(
    async (name: string) => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}/update`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok) {
          await refreshSkills();
          return { success: true };
        }
        return { success: false, error: data.details || data.error || "Update failed" };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Update failed" };
      }
    },
    [refreshSkills],
  );

  const toggleSkill = useCallback(
    async (name: string, enabled: boolean): Promise<{ success: boolean; error: string | null }> => {
      try {
        const res = await authenticatedFetch(`/api/skills/${encodeURIComponent(name)}/enable`, {
          method: "PUT",
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) {
          let errorMessage = `Toggle failed (${res.status})`;
          try {
            const data = await res.json();
            errorMessage = data.details || data.error || errorMessage;
          } catch {
            errorMessage = res.statusText || errorMessage;
          }
          return { success: false, error: errorMessage };
        }
        await refreshSkills();
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Toggle failed" };
      }
    },
    [refreshSkills],
  );

  return (
    <SkillsContext.Provider
      value={{
        skills,
        loading,
        skillsError,
        refreshSkills,
        installSkill,
        uninstallSkill,
        updateSkill,
        toggleSkill,
      }}
    >
      {children}
    </SkillsContext.Provider>
  );
}
