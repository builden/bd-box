import type { UserCardProps } from '../components/UserCard';
import type { Product } from '../components/ProductList';

export const mockUsers: UserCardProps[] = [
  {
    id: 'user-001',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://picsum.photos/100?random=1',
    role: 'admin',
    onEdit: (id) => console.log('编辑用户:', id),
    onDelete: (id) => console.log('删除用户:', id),
  },
  {
    id: 'user-002',
    name: '李四',
    email: 'lisi@example.com',
    avatar: 'https://picsum.photos/100?random=1',
    role: 'user',
    onEdit: (id) => console.log('编辑用户:', id),
    onDelete: (id) => console.log('删除用户:', id),
  },
];

export const mockProducts: Product[] = [
  { id: 'prod-001', name: 'iPhone 15 Pro', price: 8999, category: '手机' },
  { id: 'prod-002', name: 'MacBook Pro', price: 19999, category: '电脑' },
  { id: 'prod-003', name: 'AirPods Pro', price: 1899, category: '耳机' },
  { id: 'prod-004', name: 'iPad Air', price: 4799, category: '平板' },
];
