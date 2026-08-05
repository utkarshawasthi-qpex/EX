export type EmpowerSelectOption = {
  value: string;
  label: string;
};

export const EMPOWER_TIME_RANGES: EmpowerSelectOption[] = [
  { value: '12m', label: 'Last 12 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '3m', label: 'Last 3 months' },
  { value: '30d', label: 'Last 30 days' },
];
