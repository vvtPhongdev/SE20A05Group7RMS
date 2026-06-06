import { SetMetadata } from '@nestjs/common';
import { TaskType } from '@wr/contracts';

export const PLAN_LOCKED_KEY = 'plan_locked';
export const PlanLocked = (activityType: TaskType) => SetMetadata(PLAN_LOCKED_KEY, activityType);
