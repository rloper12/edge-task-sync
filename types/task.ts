export interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  groupId: string;
}

