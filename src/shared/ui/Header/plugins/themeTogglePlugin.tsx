import { HeaderPlugin } from '../types';
import { ThemeToggle } from './ThemeToggle';

export function createThemeTogglePlugin(): HeaderPlugin {
  return {
    id: 'theme-toggle',
    name: '테마 토글',
    position: 'right',
    priority: 5,
    render: () => <ThemeToggle />,
  };
}
