export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/products/list',
    'pages/products/detail',
  ],
  // 管理端分包
  subPackages: [
    {
      root: 'pages/admin',
      pages: [
        'login',
        'dashboard',
        'products/list',
        'products/edit',
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: 'Fireworks',
    navigationBarTextStyle: 'white'
  },
  // 分包预下载
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['pages/admin']
    }
  }
})
