export enum UserRole {
  FREE_USER = 'free_user',           // Can preview 8% of content
  ENROLLED_STUDENT = 'enrolled_student', // Full access to enrolled major
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  STUDENT_MANAGER = 'student_manager',
  CONTENT_MANAGER = 'content_manager',
}

// Backwards compatibility
export const UserRole_STUDENT = UserRole.FREE_USER;
