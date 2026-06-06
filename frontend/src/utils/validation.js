/**
 * Data validation utilities to ensure listing quality
 */

const PLACEHOLDERS = ['123', 'test', 'demo', 'sample', 'placeholder', 'null', 'undefined', 'lorem', 'ipsum'];

// Check if string contains placeholder dummy text
const hasPlaceholders = (text) => {
  if (!text) return true;
  const lowerText = text.toString().toLowerCase();
  return PLACEHOLDERS.some(p => lowerText.includes(p));
};

export const validateRent = (rent) => {
  if (rent == null || rent === '') return 'Rent is required.';
  
  const numRent = Number(rent);
  if (isNaN(numRent)) return 'Rent must be a valid number.';
  if (numRent <= 0) return 'Rent must be greater than zero.';
  if (numRent === 123 || numRent === 1234 || numRent === 12345) return 'Please provide a realistic rent value.';
  
  return null; // Valid
};

export const validateDescription = (desc) => {
  if (!desc || desc.trim() === '') return 'Description is required.';
  if (desc.trim().length < 50) return 'Description must be at least 50 characters long to provide sufficient context.';
  if (hasPlaceholders(desc)) return 'Description contains placeholder text. Please provide genuine property details.';
  
  return null; // Valid
};

export const validatePropertyData = (data) => {
  const errors = [];

  const rentError = validateRent(data.price);
  if (rentError) errors.push(rentError);

  const descError = validateDescription(data.description);
  if (descError) errors.push(descError);

  if (!data.area || data.area.toString().trim() === '') {
    errors.push('Property carpet area is required.');
  }

  if (data.title && hasPlaceholders(data.title)) {
    errors.push('Title contains placeholder text.');
  }
  
  if (data.city && hasPlaceholders(data.city)) {
    errors.push('City contains placeholder text.');
  }

  return errors;
};
