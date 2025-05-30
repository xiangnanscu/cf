// 订单列表 API
export default function handler() {
  const orders = [
    { id: 1, user_id: 1, product: '商品A', amount: 99.99, status: '已完成' },
    { id: 2, user_id: 2, product: '商品B', amount: 149.99, status: '处理中' }
  ];

  return {
    message: 'Orders list',
    orders,
    total: orders.length
  };
}