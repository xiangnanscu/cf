// 用户相关 API
export default function handler() {
  return {
    message: 'Users API',
    users: [
      { id: 1, name: '张三', email: 'zhangsan@example.com' },
      { id: 2, name: '王麻子', email: 'lisi@example.com' }
    ]
  };
}