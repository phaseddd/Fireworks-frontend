export default defineAppConfig({
  pages: [
    'pages/index/index',           // 客户端首页 (TabBar)
    'pages/products/list/index',   // 商品列表 (TabBar)
    'pages/products/detail/index', // 商品详情
    'pages/wishlist/index',        // 我的/意向清单 (TabBar)
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
        'products/edit/index',
      ]
    }
  ],
  // TabBar 配置 - 客户端底部导航
  tabBar: {
    color: '#999999',
    selectedColor: '#ff4800',
    backgroundColor: '#0a0a0a',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/products/list/index',
        text: '商品',
        iconPath: 'assets/icons/shop.png',
        selectedIconPath: 'assets/icons/shop-active.png'
      },
      {
        pagePath: 'pages/wishlist/index',
        text: '我的',
        iconPath: 'assets/icons/user.png',
        selectedIconPath: 'assets/icons/user-active.png'
      }
    ]
  },
  // 避免一次性加载所有分包代码导致启动异常/白屏
  lazyCodeLoading: 'requiredComponents',
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0a0a0a',
    navigationBarTitleText: '南澳烟花',
    navigationBarTextStyle: 'white'
  },
})
