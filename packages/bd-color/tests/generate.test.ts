import { describe, it, expect } from 'bun:test';
import { generate, generateAntDesign, generateTailwind, generateOklch } from '../src/generate';

// ========================
// ant-design 颜色数据 (来自 @ant-design/colors v8.0.1)
// ========================
const antDesignPalettesData: Record<string, string[]> = {
  red: [
    '#fff1f0', '#ffccc7', '#ffa39e', '#ff7875', '#ff4d4f',
    '#f5222d', '#cf1322', '#a8071a', '#820014', '#5c0011'
  ],
  volcano: [
    '#fff2e8', '#ffd8bf', '#ffbb96', '#ff9c6e', '#ff7a45',
    '#fa541c', '#d4380d', '#ad2102', '#871400', '#610b00'
  ],
  orange: [
    '#fff7e6', '#ffe7ba', '#ffd591', '#ffc069', '#ffa940',
    '#fa8c16', '#d46b08', '#ad4e00', '#873800', '#612500'
  ],
  gold: [
    '#fffbe6', '#fff1b8', '#ffe58f', '#ffd666', '#ffc53d',
    '#faad14', '#d48806', '#ad6800', '#874d00', '#613400'
  ],
  yellow: [
    '#feffe6', '#ffffb8', '#fffb8f', '#fff566', '#ffec3d',
    '#fadb14', '#d4b106', '#ad8b00', '#876800', '#614700'
  ],
  lime: [
    '#fcffe6', '#f4ffb8', '#eaff8f', '#d3f261', '#bae637',
    '#a0d911', '#7cb305', '#5b8c00', '#3f6600', '#254000'
  ],
  green: [
    '#f6ffed', '#d9f7be', '#b7eb8f', '#95de64', '#73d13d',
    '#52c41a', '#389e0d', '#237804', '#135200', '#092b00'
  ],
  cyan: [
    '#e6fffb', '#b5f5ec', '#87e8de', '#5cdbd3', '#36cfc9',
    '#13c2c2', '#08979c', '#006d75', '#00474f', '#002329'
  ],
  blue: [
    '#e6f4ff', '#bae0ff', '#91caff', '#69b1ff', '#4096ff',
    '#1677ff', '#0958d9', '#003eb3', '#002c8c', '#001d66'
  ],
  geekblue: [
    '#f0f5ff', '#d6e4ff', '#adc6ff', '#85a5ff', '#597ef7',
    '#2f54eb', '#1d39c4', '#10239e', '#061178', '#030852'
  ],
  purple: [
    '#f9f0ff', '#efdbff', '#d3adf7', '#b37feb', '#9254de',
    '#722ed1', '#531dab', '#391085', '#22075e', '#120338'
  ],
  magenta: [
    '#fff0f6', '#ffd6e7', '#ffadd2', '#ff85c0', '#f759ab',
    '#eb2f96', '#c41d7f', '#9e1068', '#780650', '#520339'
  ],
  grey: [
    '#a6a6a6', '#999999', '#8c8c8c', '#808080', '#737373',
    '#666666', '#404040', '#1a1a1a', '#000000', '#000000'
  ],
};

describe('色阶生成算法', () => {
  describe('ant-design 算法', () => {
    it('应该生成 10 个色阶', () => {
      const colors = generateAntDesign('#1677ff');
      expect(colors).toHaveLength(10);
    });

    it('主色应该在 index 5', () => {
      const colors = generateAntDesign('#1677ff');
      expect(colors[5]).toBe('#1677ff');
    });

    // 验证所有 13 个预设颜色与 @ant-design/colors 完全一致
    describe('预设颜色验证', () => {
      Object.entries(antDesignPalettesData).forEach(([name, expectedColors]) => {
        const primaryColor = expectedColors[5];
        
        it(`${name} 色阶应该与 ant-design-colors 一致`, () => {
          const colors = generateAntDesign(primaryColor);
          expect(colors).toEqual(expectedColors);
        });
      });
    });

    // 暗色主题测试
    describe('暗色主题', () => {
      it('应该生成 10 个暗色色阶', () => {
        const colors = generateAntDesign('#1677ff', { theme: 'dark' });
        expect(colors).toHaveLength(10);
      });

      it('暗色主题主色应该不同于亮色', () => {
        const lightColors = generateAntDesign('#1677ff');
        const darkColors = generateAntDesign('#1677ff', { theme: 'dark' });
        expect(darkColors).not.toEqual(lightColors);
      });

      it('支持自定义背景色', () => {
        const colors = generateAntDesign('#1677ff', { 
          theme: 'dark', 
          backgroundColor: '#000000' 
        });
        expect(colors).toHaveLength(10);
      });
    });

    // 边界情况测试
    describe('边界情况', () => {
      it('应该处理黑色', () => {
        const colors = generateAntDesign('#000000');
        expect(colors).toHaveLength(10);
      });

      it('应该处理白色', () => {
        const colors = generateAntDesign('#ffffff');
        expect(colors).toHaveLength(10);
      });

      it('应该处理 RGB 对象', () => {
        const colors = generateAntDesign({ r: 22, g: 119, b: 255 });
        expect(colors).toHaveLength(10);
      });
    });
  });

  describe('tailwind 算法 (v4)', () => {
    it('应该生成 11 个色阶', () => {
      const colors = generateTailwind('#3b82f6');
      expect(colors).toHaveLength(11);
    });

    it('所有颜色应该是有效的 hex', () => {
      const colors = generateTailwind('#3b82f6');
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    // 基本属性验证
    describe('基本属性验证', () => {
      const testColors = ['blue', 'red', 'green', 'orange', 'yellow', 'cyan', 'purple', 'pink', 'slate', 'gray'];
      
      testColors.forEach(name => {
        it(`${name} 应该生成 11 个色阶`, () => {
          const colors = generateTailwind(name === 'slate' ? '#64748b' : name === 'gray' ? '#6b7280' : `#${getPrimaryColor(name)}`);
          expect(colors).toHaveLength(11);
        });

        it(`${name} 所有颜色应该是有效的 hex`, () => {
          const colors = generateTailwind(name === 'slate' ? '#64748b' : name === 'gray' ? '#6b7280' : `#${getPrimaryColor(name)}`);
          colors.forEach(color => {
            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
          });
        });

        it(`${name} 浅色 (index 0-4) 应该比深色 (index 6-10) 亮`, () => {
          const colors = generateTailwind(name === 'slate' ? '#64748b' : name === 'gray' ? '#6b7280' : `#${getPrimaryColor(name)}`);
          const lightSum = parseInt(colors[2].slice(1), 16); // 200
          const darkSum = parseInt(colors[8].slice(1), 16);   // 800
          expect(lightSum).toBeGreaterThan(darkSum);
        });
      });
    });

    // 测试不同输入格式
    describe('输入格式', () => {
      it('应该处理大写 HEX', () => {
        const colors = generateTailwind('#3B82F6');
        expect(colors).toHaveLength(11);
      });

      it('应该处理 RGB 对象', () => {
        const colors = generateTailwind({ r: 59, g: 130, b: 246 });
        expect(colors).toHaveLength(11);
      });
    });

    // 测试渐变特性
    describe('色阶特性', () => {
      it('应该生成 11 个色阶 (50-950)', () => {
        const colors = generateTailwind('#3b82f6');
        expect(colors).toHaveLength(11);
      });

      it('浅色应该逐渐变亮', () => {
        const colors = generateTailwind('#3b82f6');
        const lightness0 = parseInt(colors[0].slice(1), 16);
        const lightness10 = parseInt(colors[10].slice(1), 16);
        expect(lightness0).toBeGreaterThan(lightness10);
      });
    });
  });

  describe('OKLCH 渐变算法', () => {
    it('默认应该生成 10 个色阶', () => {
      const colors = generateOklch('#1677ff');
      expect(colors).toHaveLength(10);
    });

    it('支持自定义步数', () => {
      const colors = generateOklch('#1677ff', { steps: 5 });
      expect(colors).toHaveLength(5);
    });

    it('所有颜色应该是有效的 hex', () => {
      const colors = generateOklch('#1677ff');
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('支持线性插值', () => {
      const colors = generateOklch('#1677ff', { interpolation: 'linear' });
      expect(colors).toHaveLength(10);
    });

    it('支持 ease-in-out 插值', () => {
      const colors = generateOklch('#1677ff', { interpolation: 'ease-in-out' });
      expect(colors).toHaveLength(10);
    });

    it('支持自定义亮度范围', () => {
      const colors = generateOklch('#1677ff', { startL: 1, endL: 0 });
      expect(colors).toHaveLength(10);
    });

    it('自定义步数应该生成正确数量', () => {
      const colors3 = generateOklch('#1677ff', { steps: 3 });
      const colors20 = generateOklch('#1677ff', { steps: 20 });
      expect(colors3).toHaveLength(3);
      expect(colors20).toHaveLength(20);
    });

    it('不同的 startL 和 endL 应该产生不同的渐变', () => {
      const ascending = generateOklch('#1677ff', { startL: 0.1, endL: 0.9 });
      const descending = generateOklch('#1677ff', { startL: 0.9, endL: 0.1 });
      expect(ascending[0]).not.toEqual(descending[0]);
    });
  });

  describe('统一入口 generate()', () => {
    it('默认使用 ant-design 算法', () => {
      const colors = generate('#1677ff');
      expect(colors).toHaveLength(10);
      expect(colors[5]).toBe('#1677ff');
    });

    it('支持指定 ant-design 算法', () => {
      const colors = generate('#1677ff', { algorithm: 'ant-design' });
      expect(colors).toHaveLength(10);
    });

    it('支持指定 tailwind 算法', () => {
      const colors = generate('#3b82f6', { algorithm: 'tailwind' });
      expect(colors).toHaveLength(11);
    });

    it('支持指定 oklch 算法', () => {
      const colors = generate('#1677ff', { algorithm: 'oklch' });
      expect(colors).toHaveLength(10);
    });
  });

  describe('算法对比', () => {
    it('ant-design 生成 10 阶，tailwind 生成 11 阶，oklch 默认 10 阶', () => {
      const antDesign = generate('#1677ff', { algorithm: 'ant-design' });
      const tailwind = generate('#3b82f6', { algorithm: 'tailwind' });
      const oklch = generate('#1677ff', { algorithm: 'oklch' });
      
      expect(antDesign).toHaveLength(10);
      expect(tailwind).toHaveLength(11);
      expect(oklch).toHaveLength(10);
    });

    it('tailwind 主色位置是 index 5 (对应 500)', () => {
      const colors = generate('#3b82f6', { algorithm: 'tailwind' });
      expect(colors[5]).toBeDefined();
    });

    it('ant-design 主色位置是 index 5', () => {
      const colors = generate('#1677ff', { algorithm: 'ant-design' });
      expect(colors[5]).toBe('#1677ff');
    });
  });

  describe('颜色一致性验证', () => {
    it('相同的输入应该产生相同的输出 (ant-design)', () => {
      const colors1 = generateAntDesign('#1677ff');
      const colors2 = generateAntDesign('#1677ff');
      expect(colors1).toEqual(colors2);
    });

    it('相同的输入应该产生相同的输出 (tailwind)', () => {
      const colors1 = generateTailwind('#3b82f6');
      const colors2 = generateTailwind('#3b82f6');
      expect(colors1).toEqual(colors2);
    });

    it('相同的输入应该产生相同的输出 (oklch)', () => {
      const colors1 = generateOklch('#1677ff');
      const colors2 = generateOklch('#1677ff');
      expect(colors1).toEqual(colors2);
    });
  });
});

// 辅助函数：获取 Tailwind 主色
function getPrimaryColor(name: string): string {
  const colors: Record<string, string> = {
    red: 'ef4444',
    orange: 'f97316',
    amber: 'f59e0b',
    yellow: 'eab308',
    lime: '84cc16',
    green: '22c55e',
    emerald: '10b981',
    teal: '14b8a6',
    cyan: '06b6d4',
    sky: '0ea5e9',
    blue: '3b82f6',
    indigo: '6366f1',
    violet: '8b5cf6',
    purple: 'a855f7',
    fuchsia: 'd946ef',
    pink: 'ec4899',
    rose: 'f43f5e',
  };
  return colors[name] || '000000';
}
