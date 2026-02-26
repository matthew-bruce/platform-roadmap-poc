export const START_YEAR = 2026;
export const START_MONTH = 0;
export const MONTH_COUNT = 18;
export const MONTH_WIDTH = 140;

const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' });

export const monthByIndex = (idx: number) => {
  const d = new Date(START_YEAR, START_MONTH + idx, 1);
  return {
    label: monthFmt.format(d),
    month: d.getMonth(),
    year: d.getFullYear(),
    date: d
  };
};

export const months = Array.from({ length: MONTH_COUNT }, (_, i) => monthByIndex(i));

export const getFyLabel = (monthIndex: number) => {
  const { month, year } = monthByIndex(monthIndex);
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `FY ${String(fyStart).slice(2)}-${String(fyEnd).slice(2)}`;
};

export const getRmgQuarter = (monthIndex: number) => {
  const { month } = monthByIndex(monthIndex);
  if ([3, 4, 5].includes(month)) return 'Q1';
  if ([6, 7, 8].includes(month)) return 'Q2';
  if ([9, 10, 11].includes(month)) return 'Q3';
  return 'Q4';
};

export const clampMonth = (v: number) => Math.max(0, Math.min(MONTH_COUNT - 1, v));
