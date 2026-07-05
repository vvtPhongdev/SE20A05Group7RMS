import { UserRole } from '@wr/contracts';

export const getRoleHomePath = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.DEPARTMENT_HEAD:
      return '/dept-head';
    case UserRole.HR_LEADER:
    case UserRole.HR_RECRUITER:
      return '/hr';
    case UserRole.CANDIDATE:
      return '/candidate';
    default:
      return '/dashboard';
  }
};
