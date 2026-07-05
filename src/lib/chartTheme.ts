// Cyber-Precision Banking chart tokens
// Colors resolve to CSS variables defined in index.css so charts follow the theme (incl. dark mode).

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--popover) / 0.95)',
  backdropFilter: 'blur(12px) saturate(160%)',
  WebkitBackdropFilter: 'blur(12px) saturate(160%)',
  border: '1px solid hsl(var(--primary) / 0.25)',
  borderRadius: '12px',
  boxShadow:
    '0 8px 32px -8px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--primary) / 0.1)',
  color: 'hsl(var(--popover-foreground))',
  fontSize: '12px',
  padding: '10px 12px',
};

export const chartTooltipItemStyle: React.CSSProperties = {
  color: 'hsl(var(--popover-foreground))',
};

export const chartTooltipLabelStyle: React.CSSProperties = {
  color: 'hsl(var(--muted-foreground))',
  fontSize: '11px',
  marginBottom: '4px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

export const chartAxisTick = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground))',
};

export const chartGridStroke = 'hsl(var(--border) / 0.5)';
export const chartAxisStroke = 'hsl(var(--border))';
