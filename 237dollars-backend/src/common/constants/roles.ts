import { UserRole } from '../../types/user-role.enum';

export const ROLES_KEY = 'roles';

export const AdminRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.STUDENT_MANAGER,
  UserRole.CONTENT_MANAGER,
];

export const ManagerRoles = [UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER];

export const ContentRoles = [UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER];
