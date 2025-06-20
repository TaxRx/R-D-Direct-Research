export interface YearData {
  year: number;
  activities: {
    [key: string]: {
      name: string;
      description: string;
      phase: string;
      timeSpent: number;
      frequency: number;
    };
  };
  roles: {
    [key: string]: {
      name: string;
      description: string;
      timeSpent: number;
      frequency: number;
    };
  };
} 