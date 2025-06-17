import { Task } from '../../src/Model/Task';
import { TaskDate } from '../../src/Model/TaskDate';
import { TaskStatus } from '../../src/Model/TaskStatus';

export const mockTasks: Task[] = [
  new Task(
    'Basic todo task',
    '',
    TaskStatus.TODO,
    undefined,
    undefined,
    undefined,
    [],
    'test.md',
    1
  ),
  new Task(
    'Task with due date',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    [],
    'test.md',
    2
  ),
  new Task(
    'Completed task',
    '',
    TaskStatus.DONE,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    [],
    'test.md',
    3
  ),
  new Task(
    'Task with tags',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    ['important', 'work'],
    'test.md',
    4
  ),
  new Task(
    'Cancelled task',
    '',
    TaskStatus.CANCELLED,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    [],
    'test.md',
    5
  ),
  new Task(
    'In progress task',
    '',
    TaskStatus.IN_PROGRESS,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    [],
    'test.md',
    6
  ),
  new Task(
    'Task with start and due dates',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    new TaskDate(new Date('2024-01-01'), false),
    new TaskDate(new Date('2024-01-02'), false),
    [],
    'test.md',
    7
  ),
  new Task(
    'Task with description',
    'This is a detailed description of the task',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    [],
    'test.md',
    8
  ),
  new Task(
    'Task with timed dates',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01T10:00:00'), true),
    new TaskDate(new Date('2024-01-01T10:00:00'), true),
    new TaskDate(new Date('2024-01-01T11:00:00'), true),
    [],
    'test.md',
    9
  )
];

export const mockTasksWithExcludedTags: Task[] = [
  new Task(
    'Task with excluded tag',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    ['excluded'],
    'test.md',
    10
  ),
  new Task(
    'Task with mixed tags',
    '',
    TaskStatus.TODO,
    new TaskDate(new Date('2024-01-01'), false),
    undefined,
    undefined,
    ['important', 'excluded'],
    'test.md',
    11
  )
];

export const expectedIcalOutput = {
  version: '2.0',
  prodid: /^-\/\/Andrew Brereton\/\/obsidian-ical-plugin v\d+\.\d+\.\d+/,
  eventCount: 9,
  todoCount: 1
};