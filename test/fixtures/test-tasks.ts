import { Task } from '../../src/Model/Task';
import { TaskDate, TaskDateName } from '../../src/Model/TaskDate';
import { TaskStatus } from '../../src/Model/TaskStatus';

export const mockTasks: Task[] = [
  new Task(
    TaskStatus.ToDo,
    [],
    'Basic todo task',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Task with due date',
    'test.md'
  ),
  new Task(
    TaskStatus.Done,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Completed task',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Task with tags',
    'test.md'
  ),
  new Task(
    TaskStatus.Cancelled,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Cancelled task',
    'test.md'
  ),
  new Task(
    TaskStatus.InProgress,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'In progress task',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [
      new TaskDate(new Date('2024-01-01'), TaskDateName.Start),
      new TaskDate(new Date('2024-01-02'), TaskDateName.Due)
    ],
    'Task with start and due dates',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Task with description',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [
      new TaskDate(new Date('2024-01-01T10:00:00'), TaskDateName.Start),
      new TaskDate(new Date('2024-01-01T11:00:00'), TaskDateName.Due)
    ],
    'Task with timed dates',
    'test.md'
  )
];

export const mockTasksWithExcludedTags: Task[] = [
  new Task(
    TaskStatus.ToDo,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Task with excluded tag',
    'test.md'
  ),
  new Task(
    TaskStatus.ToDo,
    [new TaskDate(new Date('2024-01-01'), TaskDateName.Due)],
    'Task with mixed tags',
    'test.md'
  )
];

export const expectedIcalOutput = {
  version: '2.0',
  prodid: /^-\/\/Andrew Brereton\/\/obsidian-ical-plugin v\d+\.\d+\.\d+/,
  eventCount: 9,
  todoCount: 1
};