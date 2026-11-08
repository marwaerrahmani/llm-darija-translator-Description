/**
 * Design system tokens — colours, spacing, and typography.
 */

export const colors = {
  primary:  '#1a7f4b',
  primaryDk:'#145e38',
  accent:   '#e65100',
  bg:       '#f7f8fa',
  surface:  '#ffffff',
  border:   '#e2e6ea',
  text:     '#1a1a2e',
  muted:    '#6c757d',
  error:    '#e74c3c',
  success:  '#27ae60',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  40,
};

export const typography = {
  h1:    { fontSize: 24, fontWeight: '700' as const },
  h2:    { fontSize: 18, fontWeight: '700' as const },
  body:  { fontSize: 14, lineHeight: 22 },
  small: { fontSize: 12 },
};
