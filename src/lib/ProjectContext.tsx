'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface CurrentProject {
  id: string;
  name: string;
}

interface ProjectContextType {
  currentProject: CurrentProject | null;
  setCurrentProject: (project: CurrentProject | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  setCurrentProject: () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<CurrentProject | null>(null);

  const setCurrentProject = useCallback((project: CurrentProject | null) => {
    setCurrentProjectState(project);
  }, []);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
