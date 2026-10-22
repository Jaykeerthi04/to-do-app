// Central design tokens so the whole app shares one look (dark, violet + cyan accents).
export const colors = {
  bg: '#0B0F1A',
  card: '#141A2B',
  cardAlt: '#1A2238',
  border: '#232B45',
  text: '#E8ECF8',
  muted: '#8B94B3',
  primary: '#7C5CFF',
  accent: '#22D3EE',
  danger: '#FF5C7A',
  success: '#3DDC97',
  warning: '#FFB547',
  priority: { high: '#FF5C7A', medium: '#FFB547', low: '#3DDC97' },
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const spacing = (n: number) => n * 4;
