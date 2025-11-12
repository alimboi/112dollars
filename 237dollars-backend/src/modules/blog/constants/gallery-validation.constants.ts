/**
 * Validation constants for Blog Gallery
 * These rules are used by both backend DTOs and frontend validators
 */

export const GALLERY_VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 255,
    required: false,
    errorMessages: {
      minLength: 'Title must be at least 1 character',
      maxLength: 'Title cannot exceed 255 characters',
    },
  },
  description: {
    minLength: 1,
    maxLength: 5000,
    required: false,
    errorMessages: {
      minLength: 'Description must be at least 1 character',
      maxLength: 'Description cannot exceed 5000 characters',
    },
  },
  images: {
    minItems: 1,
    required: true,
    errorMessages: {
      minItems: 'At least one image is required',
      invalidUrl: 'All images must be valid URLs',
      invalidArray: 'Images must be an array of URLs',
    },
  },
  mainImageIndex: {
    required: false,
    errorMessages: {
      invalid: 'Main image index must be a valid number',
    },
  },
};
