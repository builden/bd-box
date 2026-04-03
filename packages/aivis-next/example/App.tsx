import { FloatingButton } from '../src/shared/components';
import { Button } from '../src/shared/components';

export function App() {
  return (
    <>
      <FloatingButton onClick={() => console.log('Button clicked!')} />

      <div className="page">
        <header className="header">
          <h1>Aivis 功能测试页面</h1>
          <p>测试标注、样式编辑等功能</p>
        </header>

        <div className="grid">
          <div className="card">
            <h3>按钮卡片</h3>
            <p>这是一个普通的卡片组件</p>
            <div className="nav">
              <Button>主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
            </div>
          </div>

          <div className="card">
            <h3>输入框</h3>
            <p>这是一个输入框组件</p>
            <input type="text" placeholder="请输入..." className="w-full p-2 mt-2 border border-gray-300 rounded" />
          </div>

          <div className="card">
            <h3>颜色选择</h3>
            <p>选择你喜欢的颜色</p>
            <div className="flex gap-2 mt-3">
              <span className="w-6 h-6 rounded" style={{ backgroundColor: '#0088FF' }} />
              <span className="w-6 h-6 rounded" style={{ backgroundColor: '#34C759' }} />
              <span className="w-6 h-6 rounded" style={{ backgroundColor: '#FF383C' }} />
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
