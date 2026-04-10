'use client';

import { createContext, useContext, useRef, useCallback } from 'react';

interface NumberMapping {
  projects: { number: number; id: string; name: string }[];
  tasks: { number: number; id: string; title: string; projectName: string }[];
}

interface TaskNumberContextType {
  getMapping: () => NumberMapping;
  setMapping: (mapping: NumberMapping) => void;
}

const TaskNumberContext = createContext<TaskNumberContextType>({
  getMapping: () => ({ projects: [], tasks: [] }),
  setMapping: () => {},
});

export function TaskNumberProvider({ children }: { children: React.ReactNode }) {
  const mappingRef = useRef<NumberMapping>({ projects: [], tasks: [] });

  const getMapping = useCallback(() => mappingRef.current, []);
  const setMapping = useCallback((mapping: NumberMapping) => {
    mappingRef.current = mapping;
  }, []);

  return (
    <TaskNumberContext.Provider value={{ getMapping, setMapping }}>
      {children}
    </TaskNumberContext.Provider>
  );
}

export function useTaskNumbers() {
  return useContext(TaskNumberContext);
}
