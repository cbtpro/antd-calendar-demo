/**
 * 轻量全局提示。
 * 独立于 UI 库实现：antd 5.0.2 的静态 message 依赖旧版 ReactDOM 渲染，
 * 在当前 React 19 环境下不会挂载节点，因此这里直接操作 DOM 保证反馈可靠。
 */

export type ToastType = 'info' | 'warning';

interface ToastStyle {
  accent: string;
  icon: string;
}

const TOAST_STYLE: Record<ToastType, ToastStyle> = {
  info: { accent: '#1677ff', icon: 'i' },
  warning: { accent: '#faad14', icon: '!' },
};

const CONTAINER_ID = 'event-toast-container';
const DURATION = 3000;
/** 同时最多显示的提示数量，超出时移除最早的一条。 */
const MAX_COUNT = 3;

function getContainer(): HTMLElement {
  const existing = document.getElementById(CONTAINER_ID);
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  Object.assign(container.style, {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1050',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
  });
  document.body.appendChild(container);
  return container;
}

function removeToast(toast: HTMLElement) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-8px)';
  window.setTimeout(() => toast.remove(), 200);
}

/** 显示一条自动消失的提示，用于拖拽吸附等即时反馈。 */
export function showToast(text: string, type: ToastType = 'info') {
  if (typeof document === 'undefined') return;
  const container = getContainer();
  while (container.childElementCount >= MAX_COUNT) {
    const oldest = container.firstElementChild;
    if (!oldest) break;
    oldest.remove();
  }

  const { accent, icon } = TOAST_STYLE[type];
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '520px',
    padding: '8px 12px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'rgba(0, 0, 0, 0.88)',
    background: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderInlineStart: `3px solid ${accent}`,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
    opacity: '0',
    transform: 'translateY(-8px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  });

  const iconNode = document.createElement('span');
  Object.assign(iconNode.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    width: '16px',
    height: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    background: accent,
    borderRadius: '2px',
  });
  iconNode.textContent = icon;

  const textNode = document.createElement('span');
  textNode.textContent = text;

  toast.append(iconNode, textNode);
  container.appendChild(toast);

  // 下一帧再切换样式，保证入场过渡生效。
  window.requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => removeToast(toast), DURATION);
}
