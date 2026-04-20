export const permissionsMap = Object.freeze({
  ADMIN: [
    'student:read', 'student:write',
    'subject:read',
    'course:read',
    'section:read',
    'review:access', 'review:read:all', 'review:write', 'review:update', 'review:delete',
    'try:access', 'try:read:all', 'try:write', 'try:update', 'try:delete',
    'profile:read',
    'career:bypass_enrollment',
  ],
  STUDENT: [
    'subject:read',
    'section:read',
    'review:access', 'review:write', 'review:update', 'review:delete',
    'try:access', 'try:write', 'try:update', 'try:delete',
    'profile:read',
  ],
  INACTIVE: [],
});
