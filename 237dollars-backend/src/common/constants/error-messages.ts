export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'You are not authorized to perform this action',

  // Students
  STUDENT_NOT_FOUND: 'Student not found',
  STUDENT_MATCH_FAILED: 'No matching student record found. Please enroll first.',
  INVALID_STUDENT_DATA: 'Invalid student data provided',

  // Enrollments
  ENROLLMENT_NOT_FOUND: 'Enrollment not found',
  ENROLLMENT_ALREADY_EXISTS: 'Enrollment already exists for this course',

  // References & Content
  REFERENCE_NOT_FOUND: 'Reference not found',
  CONTENT_BLOCK_NOT_FOUND: 'Content block not found',
  TOPIC_NOT_FOUND: 'Topic not found',
  MAJOR_NOT_FOUND: 'Major not found',
  CONTENT_LOCKED: 'Please unlock this content by adding 5 members to our Telegram group',

  // Quizzes
  QUIZ_NOT_FOUND: 'Quiz not found',
  QUIZ_ALREADY_TAKEN: 'You have already taken this quiz. No retakes allowed.',
  QUIZ_TIME_EXPIRED: 'Quiz time has expired',
  INVALID_QUIZ_ANSWERS: 'Invalid quiz answers provided',

  // Discounts
  DISCOUNT_NOT_ELIGIBLE: 'You are not eligible for discount yet. Complete the topic first.',
  DISCOUNT_CODE_INVALID: 'Invalid or expired discount code',
  DISCOUNT_ALREADY_USED: 'Discount code has already been used',

  // General
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again later.',
  INVALID_FILE_FORMAT: 'Invalid file format. Only JPG and PNG are allowed.',
  FILE_TOO_LARGE: 'File size exceeds 2MB limit',
  FORBIDDEN: 'You do not have permission to access this resource',
};
