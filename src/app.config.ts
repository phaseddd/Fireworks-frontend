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
        'products/add/index',
        'products/edit',
      ]
    }
  ],
  // 避免一次性加载所有分包代码导致启动异常/白屏
  lazyCodeLoading: 'requiredComponents',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: 'Fireworks',
    navigationBarTextStyle: 'white'
  },
})
