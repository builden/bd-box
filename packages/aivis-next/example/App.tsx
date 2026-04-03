import { FloatingButton } from '../src/shared/components';

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
              <button>主要按钮</button>
              <button>次要按钮</button>
            </div>
          </div>

          <div className="card">
            <h3>输入框</h3>
            <p>这是一个输入框组件</p>
            <input type="text" placeholder="请输入..." style={{ width: '100%', padding: '8px', marginTop: '8px' }} />
          </div>

          <div className="card">
            <h3>颜色选择</h3>
            <p>选择你喜欢的颜色</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span style={{ width: 24, height: 24, background: '#0088FF', borderRadius: 4 }} />
              <span style={{ width: 24, height: 24, background: '#34C759', borderRadius: 4 }} />
              <span style={{ width: 24, height: 24, background: '#FF383C', borderRadius: 4 }} />
            </div>
          </div>

          <div className="card">
            <h3>旋转动画</h3>
            <p>测试动画暂停功能</p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
              <div
                className="spinner"
                style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #e0e0e0',
                  borderTopColor: '#0088FF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
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

          <div style={{ flex: 1 }}>
            <div className="card">
              <h3>主内容区</h3>
              <p>这里是主要内容区域，可以滚动查看更多内容。</p>
              <div style={{ height: 300, background: '#f0f0f0', marginTop: 16, borderRadius: 8 }}>
                <img
                  src="https://picsum.photos/800/300"
                  alt="placeholder"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
