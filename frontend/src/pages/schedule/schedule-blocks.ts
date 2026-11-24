import type { EnrollmentSubject, Schedule } from '@/types';

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function subjectScheduleBlocks(subject: EnrollmentSubject): Schedule[] {
  if (subject.status === 'cancelled' || !subject.schedule) return [];
  const anchor = subject.schedule;
  const schedules = anchor.group?.schedules?.length ? anchor.group.schedules : [anchor];
  // Only blocks of the enrolled group; keep old API responses with a single schedule usable.
  const unique = new Map<string, Schedule>();
  for (const schedule of schedules) {
    if (schedule.groupId === anchor.groupId && !unique.has(schedule.id)) unique.set(schedule.id, schedule);
  }
  return [...unique.values()].sort((a, b) => WEEK_DAYS.indexOf(a.dayOfWeek) - WEEK_DAYS.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
}

export function timetableBlocks(subjects: EnrollmentSubject[]) {
  return subjects.flatMap(subject => subjectScheduleBlocks(subject).map(schedule => ({ subject, schedule })));
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function timetableRange(schedules: Schedule[]) {
  return {
    startHour: Math.min(6, ...schedules.map(schedule => Math.floor(toMinutes(schedule.startTime) / 60))),
    endHour: Math.max(20, ...schedules.map(schedule => Math.ceil(toMinutes(schedule.endTime) / 60))),
  };
}
