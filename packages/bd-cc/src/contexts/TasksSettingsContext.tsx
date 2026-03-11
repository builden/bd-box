import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../utils/api";

interface InstallationStatus {
  installation?: {
    isInstalled: boolean;
  };
  isReady: boolean;
}

interface TasksSettingsContextValue {
  tasksEnabled: boolean;
  setTasksEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleTasksEnabled: () => void;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
  installationStatus: InstallationStatus | null;
  isCheckingInstallation: boolean;
}

const TasksSettingsContext = createContext<TasksSettingsContextValue>({
  tasksEnabled: true,
  setTasksEnabled: () => {},
  toggleTasksEnabled: () => {},
  isTaskMasterInstalled: null,
  isTaskMasterReady: null,
  installationStatus: null,
  isCheckingInstallation: true,
});

export const useTasksSettings = () => {
  const context = useContext(TasksSettingsContext);
  if (!context) {
    throw new Error("useTasksSettings must be used within a TasksSettingsProvider");
  }
  return context;
};

interface TasksSettingsProviderProps {
  children: ReactNode;
}

export const TasksSettingsProvider = ({ children }: TasksSettingsProviderProps) => {
  const [tasksEnabled, setTasksEnabled] = useState<boolean>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem("tasks-enabled");
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });

  const [isTaskMasterInstalled, setIsTaskMasterInstalled] = useState<boolean | null>(null);
  const [isTaskMasterReady, setIsTaskMasterReady] = useState<boolean | null>(null);
  const [installationStatus, setInstallationStatus] = useState<InstallationStatus | null>(null);
  const [isCheckingInstallation, setIsCheckingInstallation] = useState(true);

  // Save to localStorage whenever tasksEnabled changes
  useEffect(() => {
    localStorage.setItem("tasks-enabled", JSON.stringify(tasksEnabled));
  }, [tasksEnabled]);

  // Check TaskMaster installation status asynchronously on component mount
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const response = await api.get("/taskmaster/installation-status");
        if (response.ok) {
          const data = (await response.json()) as InstallationStatus;
          setInstallationStatus(data);
          setIsTaskMasterInstalled(data.installation?.isInstalled || false);
          setIsTaskMasterReady(data.isReady || false);

          // If TaskMaster is not installed and user hasn't explicitly enabled tasks,
          // disable tasks automatically
          const userEnabledTasks = localStorage.getItem("tasks-enabled");
          if (!data.installation?.isInstalled && !userEnabledTasks) {
            setTasksEnabled(false);
          }
        } else {
          console.error("Failed to check TaskMaster installation status");
          setIsTaskMasterInstalled(false);
          setIsTaskMasterReady(false);
        }
      } catch (error) {
        console.error("Error checking TaskMaster installation:", error);
        setIsTaskMasterInstalled(false);
        setIsTaskMasterReady(false);
      } finally {
        setIsCheckingInstallation(false);
      }
    };

    // Run check asynchronously without blocking initial render
    setTimeout(checkInstallation, 0);
  }, []);

  const toggleTasksEnabled = () => {
    setTasksEnabled((prev) => !prev);
  };

  const contextValue: TasksSettingsContextValue = {
    tasksEnabled,
    setTasksEnabled,
    toggleTasksEnabled,
    isTaskMasterInstalled,
    isTaskMasterReady,
    installationStatus,
    isCheckingInstallation,
  };

  return <TasksSettingsContext.Provider value={contextValue}>{children}</TasksSettingsContext.Provider>;
};

export default TasksSettingsContext;
