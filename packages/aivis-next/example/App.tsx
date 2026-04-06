import { Toolbar } from '../src/shared/features/Toolbar';
import { AnnotationOverlay } from '../src/shared/features/Annotation';
import { Button } from './Button';

// =============================================================================
// 测试组件：用户卡片
// Props 丰富：id, name, email, avatar, role, onEdit, onDelete
// =============================================================================
interface UserCardProps {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function UserCard({ id, name, email, avatar, role, onEdit, onDelete }: UserCardProps) {
  return (
    <div className="card" data-testid={`user-card-${id}`}>
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
        <span className="ml-auto px-2 py-1 text-xs bg-blue-100 rounded">{role}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={() => onEdit(id)}>
          编辑
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDelete(id)}>
          删除
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// 测试组件：产品列表
// Props：title, products (数组), onAddToCart, onRemove, filter
// =============================================================================
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ProductListProps {
  title: string;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemove: (productId: string) => void;
  filter?: string;
  maxItems?: number;
}

function ProductList({ title, products, onAddToCart, onRemove, filter, maxItems = 10 }: ProductListProps) {
  const filteredProducts = filter ? products.filter((p) => p.category === filter || p.name.includes(filter)) : products;

  return (
    <div className="card">
      <h4>{title}</h4>
      <p className="text-sm text-gray-500">共 {filteredProducts.length} 个商品</p>
      <div className="mt-2 space-y-2">
        {filteredProducts.slice(0, maxItems).map((product) => (
          <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>
              {product.name} - ¥{product.price}
            </span>
            <Button size="sm" onClick={() => onAddToCart(product)}>
              添加
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// 测试组件：统计卡片
// Props：title, value, trend, change, period, isLoading
// =============================================================================
interface StatsCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  change?: number;
  period?: string;
  isLoading?: boolean;
  format?: 'number' | 'currency' | 'percentage';
}

function StatsCard({ title, value, trend, change, period, isLoading, format = 'number' }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const formattedValue = format === 'currency' ? `¥${value}` : format === 'percentage' ? `${value}%` : value;

  return (
    <div className="card" data-stats-title={title}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{formattedValue}</p>
      {change !== undefined && (
        <p className={`text-sm ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}%
          {period && <span className="text-gray-400"> {period}</span>}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// 测试数据
// =============================================================================
const mockUsers: UserCardProps[] = [
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

const mockProducts: Product[] = [
  { id: 'prod-001', name: 'iPhone 15 Pro', price: 8999, category: '手机' },
  { id: 'prod-002', name: 'MacBook Pro', price: 19999, category: '电脑' },
  { id: 'prod-003', name: 'AirPods Pro', price: 1899, category: '耳机' },
  { id: 'prod-004', name: 'iPad Air', price: 4799, category: '平板' },
];

export function App() {
  const handleEdit = (id: string) => alert(`编辑: ${id}`);
  const handleDelete = (id: string) => alert(`删除: ${id}`);
  const handleAddToCart = (product: Product) => alert(`添加购物车: ${product.name}`);

  return (
    <>
      <Toolbar />
      <AnnotationOverlay />

      <div className="page">
        <header className="header">
          <h1>Aivis 功能测试页面</h1>
          <p>测试标注、样式编辑等功能</p>
        </header>

        {/* ===================================================================== */}
        {/* 第一行：按钮卡片 - 点击 Button 组件测试 Props */}
        {/* ===================================================================== */}
        <div className="grid">
          <div className="card">
            <h3>按钮卡片</h3>
            <p>点击下面的按钮测试 Props 获取（variant, size, onClick, disabled）</p>
            <div className="nav">
              <Button variant="primary" size="md" onClick={() => alert('主要按钮点击')}>
                主要按钮
              </Button>
              <Button variant="secondary" size="md" disabled>
                禁用按钮
              </Button>
              <Button variant="primary" size="sm" onClick={() => console.log('small clicked')}>
                小型按钮
              </Button>
            </div>
          </div>

          <div className="card">
            <h3>输入框</h3>
            <p>这是一个输入框组件</p>
            <input
              type="text"
              placeholder="请输入..."
              className="w-full p-2 mt-2 border border-gray-300 rounded"
              id="test-input"
              data-testid="text-input"
            />
          </div>

          <div className="card">
            <h3>颜色选择</h3>
            <p>选择你喜欢的颜色</p>
            <div className="flex gap-2 mt-3">
              <span
                className="w-6 h-6 rounded cursor-pointer"
                style={{ backgroundColor: '#0088FF' }}
                data-color="blue"
              />
              <span
                className="w-6 h-6 rounded cursor-pointer"
                style={{ backgroundColor: '#34C759' }}
                data-color="green"
              />
              <span
                className="w-6 h-6 rounded cursor-pointer"
                style={{ backgroundColor: '#FF383C' }}
                data-color="red"
              />
            </div>
          </div>

          <div className="card">
            <h3>旋转动画</h3>
            <p>测试动画暂停功能</p>
            <div className="flex justify-center items-center mt-4">
              <div className="spinner w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 第二行：用户卡片 - 点击测试 UserCard Props */}
        {/* Props: id, name, email, avatar, role, onEdit, onDelete */}
        {/* ===================================================================== */}
        <div className="grid">
          {mockUsers.map((user) => (
            <UserCard key={user.id} {...user} />
          ))}
        </div>

        {/* ===================================================================== */}
        {/* 第三行：产品列表 - 测试 ProductList Props */}
        {/* Props: title, products, onAddToCart, onRemove, filter, maxItems */}
        {/* ===================================================================== */}
        <div className="mt-6">
          <ProductList
            title="商品列表"
            products={mockProducts}
            onAddToCart={handleAddToCart}
            onRemove={(id) => console.log('remove:', id)}
            filter=""
            maxItems={4}
          />
        </div>

        {/* ===================================================================== */}
        {/* 第四行：统计卡片 - 测试 StatsCard Props */}
        {/* Props: title, value, trend, change, period, isLoading, format */}
        {/* ===================================================================== */}
        <div className="grid mt-6">
          <StatsCard title="总销售额" value={128500} trend="up" change={12.5} period="较上月" format="currency" />
          <StatsCard title="订单数量" value={892} trend="down" change={-3.2} period="较上周" format="number" />
          <StatsCard title="转化率" value={4.8} trend="up" change={0.5} period="较昨日" format="percentage" />
        </div>

        {/* ===================================================================== */}
        {/* 底部内容区域 */}
        {/* ===================================================================== */}
        <div className="flex gap-5 mt-10">
          <div className="sidebar">
            <h4>侧边栏</h4>
            <ul>
              <li>仪表盘</li>
              <li>用户管理</li>
              <li>订单列表</li>
              <li>数据分析</li>
              <li>系统设置</li>
            </ul>
          </div>

          <div className="flex-1">
            <div className="card">
              <h3>主内容区</h3>
              <p>这里是主要内容区域，可以滚动查看更多内容。</p>
              <div className="h-[300px] bg-gray-200 mt-4 rounded-lg overflow-hidden">
                <img
                  src="https://picsum.photos/800/300"
                  alt="placeholder"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
