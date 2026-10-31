import React from 'react';

import { Button } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

/** 主题切换按钮：只关心图标与提示文案，主题状态由外层持有。 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  const label = isDark ? '切换到明亮模式' : '切换到暗黑模式';

  return (
    <Button
      type="text"
      shape="circle"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={onToggle}
      aria-label={label}
      title={label}
    />
  );
};

export default ThemeToggle;
