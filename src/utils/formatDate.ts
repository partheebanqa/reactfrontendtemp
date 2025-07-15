export const formatDate = (isoDate: string, locale: string = 'en-GB') => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString(locale);
};
