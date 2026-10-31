import React from 'react';

/** 保活页面是否处于激活状态；隐藏页面的 portal 内容（如 Modal）需要据此收起。 */
export const PageActiveContext = React.createContext(true);

/** 页面组件读取自身是否可见，默认 true 以便脱离保活容器单独使用。 */
export function usePageActive(): boolean {
  return React.useContext(PageActiveContext);
}
