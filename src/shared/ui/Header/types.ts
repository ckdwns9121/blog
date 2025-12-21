import { ReactNode } from 'react';

export interface HeaderPlugin {
  id: string;
  name: string;
  position: 'left' | 'center' | 'right';
  render: () => ReactNode;
  priority?: number; // 높은 숫자일수록 우선순위가 높음
}

export interface HeaderSectionProps {
  plugins: HeaderPlugin[];
  position: 'left' | 'center' | 'right';
  className?: string;
}