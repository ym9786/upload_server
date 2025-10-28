// notification.js

// 提示类型
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// 存储当前显示的提示
let currentNotifications = [];

/**
 * 显示悬浮提示
 * @param {string} message 提示消息
 * @param {string} type 提示类型 (success, error, info, warning)
 * @param {number} duration 显示时长(毫秒)，0表示不自动关闭
 */
export function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
  // 确保提示容器存在
  let notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }

  // 创建提示元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // 根据类型设置图标
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-message">${message}</div>
    <button class="notification-close">×</button>
  `;
  
  // 添加到容器
  notificationContainer.appendChild(notification);
  
  // 存储引用
  const notificationId = Date.now() + Math.random();
  currentNotifications.push({
    id: notificationId,
    element: notification
  });
  
  // 添加显示动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 关闭按钮事件
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    removeNotification(notificationId);
  });
  
  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notificationId);
    }, duration);
  }
  
  return notificationId;
}

/**
 * 移除指定提示
 * @param {number} notificationId 提示ID
 */
export function removeNotification(notificationId) {
  const index = currentNotifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    const { element } = currentNotifications[index];
    element.classList.remove('show');
    element.classList.add('hide');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      currentNotifications.splice(index, 1);
    }, 300);
  }
}

/**
 * 清除所有提示
 */
export function clearAllNotifications() {
  currentNotifications.forEach(notification => {
    if (notification.element.parentNode) {
      notification.element.parentNode.removeChild(notification.element);
    }
  });
  currentNotifications = [];
}

// 导出快捷方法
export const notify = {
  success: (message, duration) => showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration),
  error: (message, duration) => showNotification(message, NOTIFICATION_TYPES.ERROR, duration),
  info: (message, duration) => showNotification(message, NOTIFICATION_TYPES.INFO, duration),
  warning: (message, duration) => showNotification(message, NOTIFICATION_TYPES.WARNING, duration)
};

/**
 * 显示确认对话框
 * @param {string} message 确认消息
 * @param {string} confirmText 确认按钮文字
 * @param {string} cancelText 取消按钮文字
 * @returns {Promise<boolean>} 用户选择结果
 */
export function showConfirm(message, confirmText = "确定", cancelText = "取消") {
  return new Promise((resolve) => {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    // 创建确认对话框
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
      <div class="confirm-message">${message}</div>
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-cancel">${cancelText}</button>
        <button class="confirm-btn confirm-ok">${confirmText}</button>
      </div>
    `;
    
    overlay.appendChild(confirmDialog);
    document.body.appendChild(overlay);
    
    // 添加显示动画
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // 按钮事件处理
    const cancelBtn = confirmDialog.querySelector('.confirm-cancel');
    const okBtn = confirmDialog.querySelector('.confirm-ok');
    
    const closeDialog = (result) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
      resolve(result);
    };
    
    cancelBtn.addEventListener('click', () => closeDialog(false));
    okBtn.addEventListener('click', () => closeDialog(true));
    
    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });
  });
}