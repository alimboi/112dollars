/**
 * Validation constants for Blog Gallery (Frontend)
 * Mirror of backend validation rules for frontend form validation
 */

export const GALLERY_VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 255,
    required: false,
    placeholder: 'Gallery title (optional)',
    errorMessages: {
      minLength: 'Title must be at least 1 character',
      maxLength: 'Title cannot exceed 255 characters',
      required: 'Title is required',
    },
  },
  description: {
    minLength: 1,
    maxLength: 5000,
    required: false,
    placeholder: 'Gallery description (optional)',
    errorMessages: {
      minLength: 'Description must be at least 1 character',
      maxLength: 'Description cannot exceed 5000 characters',
      required: 'Description is required',
    },
  },
  images: {
    minItems: 1,
    required: true,
    errorMessages: {
      minItems: 'At least one image is required',
      invalidUrl: 'All images must be valid URLs',
      invalidArray: 'Images must be an array of URLs',
      required: 'At least one image is required',
    },
  },
  mainImageIndex: {
    required: false,
    errorMessages: {
      invalid: 'Main image index must be a valid number',
    },
  },
};
