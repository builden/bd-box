import { describe, it, expect } from 'bun:test';
import {
  antDesignPalettes,
  antDesignDarkPalettes,
  tailwindPalettes,
  antDesignPrimaryColors,
  tailwindPrimaryColors,
} from '../src/presets';

describe('ant-design 预设颜色', () => {
  it('应该包含所有 13 个预设颜色', () => {
    expect(Object.keys(antDesignPalettes)).toHaveLength(13);
  });

  it('每个预设应该有 10 个色阶', () => {
    Object.values(antDesignPalettes).forEach(palette => {
      expect(palette).toHaveLength(10);
    });
  });

  it('每个预设应该有 primary 属性', () => {
    Object.values(antDesignPalettes).forEach(palette => {
      expect(palette.primary).toBeDefined();
    });
  });

  it('主色应该在 index 5', () => {
    Object.entries(antDesignPalettes).forEach(([name, palette]) => {
      expect(palette[5]).toBe(palette.primary!);
    });
  });

  // 验证 blue 预设
  it('blue 预设应该正确', () => {
    const blue = antDesignPalettes.blue;
    expect(blue.primary).toBe('#1677ff');
    expect(blue[5]).toBe('#1677ff');
  });

  it('red 预设应该正确', () => {
    const red = antDesignPalettes.red;
    expect(red.primary).toBe('#f5222d');
    expect(red[5]).toBe('#f5222d');
  });

  it('green 预设应该正确', () => {
    const green = antDesignPalettes.green;
    expect(green.primary).toBe('#52c41a');
    expect(green[5]).toBe('#52c41a');
  });
});

describe('ant-design 暗色预设', () => {
  it('应该包含所有 13 个暗色预设', () => {
    expect(Object.keys(antDesignDarkPalettes)).toHaveLength(13);
  });

  it('每个暗色预设应该有 10 个色阶', () => {
    Object.values(antDesignDarkPalettes).forEach(palette => {
      expect(palette).toHaveLength(10);
    });
  });

  it('暗色预设应该与亮色不同', () => {
    expect(antDesignDarkPalettes.blue).not.toEqual(antDesignPalettes.blue);
  });
});

describe('tailwind 预设颜色', () => {
  it('应该包含所有预设颜色', () => {
    expect(Object.keys(tailwindPalettes)).toHaveLength(22);
  });

  it('每个预设应该有 11 个色阶', () => {
    Object.values(tailwindPalettes).forEach(palette => {
      expect(palette).toHaveLength(11);
    });
  });

  it('每个预设应该有 primary 属性', () => {
    Object.values(tailwindPalettes).forEach(palette => {
      expect(palette.primary).toBeDefined();
    });
  });

  it('主色应该在 index 5 (500)', () => {
    Object.values(tailwindPalettes).forEach(palette => {
      expect(palette[5]).toBe(palette.primary!);
    });
  });

  it('blue 预设应该正确', () => {
    const blue = tailwindPalettes.blue;
    expect(blue.primary!).toBeDefined();
    expect(blue[5]).toBe(blue.primary!);
  });

  it('red 预设应该正确', () => {
    const red = tailwindPalettes.red;
    expect(red.primary!).toBeDefined();
    expect(red[5]).toBe(red.primary!);
  });
});

describe('主色颜色值', () => {
  it('ant-design 主色应该匹配', () => {
    expect(antDesignPrimaryColors.blue).toBe('#1677FF');
    expect(antDesignPrimaryColors.red).toBe('#F5222D');
    expect(antDesignPrimaryColors.green).toBe('#52C41A');
  });

  it('tailwind 主色应该匹配', () => {
    expect(tailwindPrimaryColors.blue).toBe('#3b82f6');
    expect(tailwindPrimaryColors.red).toBe('#ef4444');
    expect(tailwindPrimaryColors.green).toBe('#22c55e');
  });
});

describe('算法对比', () => {
  it('ant-design 产生 10 阶，tailwind 产生 11 阶', () => {
    expect(antDesignPalettes.red).toHaveLength(10);
    expect(tailwindPalettes.red).toHaveLength(11);
  });

  it('两者主色位置相同都在 index 5', () => {
    // ant-design 主色在 index 5
    expect(antDesignPalettes.red[5]).toBe(antDesignPalettes.red.primary!);
    // tailwind 主色在 index 5 (对应 500)
    expect(tailwindPalettes.red[5]).toBe(tailwindPalettes.red.primary!);
  });
});
