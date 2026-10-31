import React from 'react';

import { Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

import { LOCALE_META } from '../locale';
import type { LocaleKey } from '../locale';

interface LocaleToggleProps {
  locale: LocaleKey;
  onToggle: () => void;
}

/** 语言切换按钮：展示当前语言名，切换目标与提示文案集中在 LOCALE_META。 */
const LocaleToggle: React.FC<LocaleToggleProps> = ({ locale, onToggle }) => {
  const { label, switchTitle } = LOCALE_META[locale];

  return (
    <Button
      type="text"
      size="small"
      icon={<GlobalOutlined />}
      onClick={onToggle}
      aria-label={switchTitle}
      title={switchTitle}
    >
      {label}
    </Button>
  );
};

export default LocaleToggle;
