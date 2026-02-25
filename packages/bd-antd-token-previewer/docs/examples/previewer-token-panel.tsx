import React from 'react';
import { Space } from 'antd';
import type { TokenPreviewProps } from 'bd-antd-token-previewer';
import { TokenPanel } from 'bd-antd-token-previewer';

export default () => {
  const tokens = [
    {
      config: {},
      key: 'default',
      name: '默认主题',
    },
  ] as TokenPreviewProps['themes'];

  return (
    <div
      style={{
        background: '#F5F7FA',
      }}
    >
      <Space align="start">
        <TokenPanel themes={tokens} />
      </Space>
    </div>
  );
};
