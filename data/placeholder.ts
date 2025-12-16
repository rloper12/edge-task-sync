import { Group, Task } from '@/types/task';

export const placeholderGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Work Tasks',
    description: 'Tasks related to work and professional projects',
  },
  {
    id: 'group-2',
    name: 'Personal Tasks',
    description: 'Personal and household tasks',
  },
  {
    id: 'group-3',
    name: 'Learning',
    description: 'Tasks for learning and skill development',
  },
];

export const placeholderTasks: Task[] = [
  // Work Tasks
  {
    id: 'task-1',
    title: 'Complete quarterly report',
    description: 'Finish the Q4 financial report and submit to management',
    completed: false,
    groupId: 'group-1',
  },
  {
    id: 'task-2',
    title: 'Team meeting preparation',
    description: 'Prepare agenda and slides for the weekly team meeting',
    completed: true,
    groupId: 'group-1',
  },
  {
    id: 'task-3',
    title: 'Review code pull requests',
    description: 'Review and approve pending pull requests from the team',
    completed: false,
    groupId: 'group-1',
  },
  {
    id: 'task-4',
    title: 'Update project documentation',
    description: 'Update API documentation and user guides',
    completed: false,
    groupId: 'group-1',
  },
  // Personal Tasks
  {
    id: 'task-5',
    title: 'Grocery shopping',
    description: 'Buy groceries for the week',
    completed: false,
    groupId: 'group-2',
  },
  {
    id: 'task-6',
    title: 'Call dentist',
    description: 'Schedule annual dental checkup',
    completed: true,
    groupId: 'group-2',
  },
  {
    id: 'task-7',
    title: 'Plan weekend trip',
    description: 'Research and book accommodations for the weekend getaway',
    completed: false,
    groupId: 'group-2',
  },
  // Learning Tasks
  {
    id: 'task-8',
    title: 'Complete React Native course',
    description: 'Finish the advanced React Native course on mobile development',
    completed: false,
    groupId: 'group-3',
  },
  {
    id: 'task-9',
    title: 'Read TypeScript handbook',
    description: 'Read chapters 5-8 of the TypeScript handbook',
    completed: true,
    groupId: 'group-3',
  },
];

export function getTasksByGroupId(groupId: string): Task[] {
  return placeholderTasks.filter((task) => task.groupId === groupId);
}

export function getGroupById(groupId: string): Group | undefined {
  return placeholderGroups.find((group) => group.id === groupId);
}

