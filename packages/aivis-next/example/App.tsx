import { Toolbar } from '../src/shared/features/Toolbar';
import { AnnotationOverlay } from '../src/shared/features/Annotation';
import { Button } from './Button';
import { UserCard } from './components/UserCard';
import { ProductList } from './components/ProductList';
import { StatsCard } from './components/StatsCard';
import { mockUsers, mockProducts } from './data/mockData';
import type { Product } from './components/ProductList';

export function App() {
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

        {/* 第一行：按钮卡片 */}
        <div className="grid">
          <div className="card">
            <h3>按钮卡片</h3>
            <p>点击下面的按钮测试 Props 获取</p>
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

        {/* 第二行：用户卡片 */}
        <div className="grid">
          {mockUsers.map((user) => (
            <UserCard key={user.id} {...user} />
          ))}
        </div>

        {/* 第三行：产品列表 */}
        <div className="mt-6">
          <ProductList title="商品列表" products={mockProducts} onAddToCart={handleAddToCart} filter="" maxItems={4} />
        </div>

        {/* 第四行：统计卡片 */}
        <div className="grid mt-6">
          <StatsCard title="总销售额" value={128500} trend="up" change={12.5} period="较上月" format="currency" />
          <StatsCard title="订单数量" value={892} trend="down" change={-3.2} period="较上周" format="number" />
          <StatsCard title="转化率" value={4.8} trend="up" change={0.5} period="较昨日" format="percentage" />
        </div>

        {/* 底部内容区域 */}
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
