// more config: https://d.umijs.org/config
import { defineConfig } from 'dumi';
import path from 'path';

const isProdSite =
  // 不是预览模式 同时是生产环境
  process.env.PREVIEW !== '1' && process.env.NODE_ENV === 'production';
const sitePrefix = isProdSite ? '/bd-antd-token-previewer' : '';

export default defineConfig({
  alias: {
    'bd-antd-token-previewer': path.resolve(__dirname, './src'),
  },
  themeConfig: {
    name: 'Theme Editor',
    sideBar: {},
    nav: [
      { title: 'Theme Editor', link: '/editor' },
      { title: 'Previewer', link: '/previewer' },
      { title: 'Others', link: '/others/color-panel' },
    ],
    logo: `${sitePrefix}/icon/theme-editor.svg`,
  },
  favicons: [`${sitePrefix}/icon/theme-editor.svg`],
  outputPath: '.doc',
  ssr: process.env.NODE_ENV === 'production' ? {} : false,
  exportStatic: {},
  base: isProdSite ? '/bd-antd-token-previewer/' : '/',
  publicPath: isProdSite ? '/bd-antd-token-previewer/' : '/',
  hash: true,
});
