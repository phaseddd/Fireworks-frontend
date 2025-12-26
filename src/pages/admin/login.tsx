import { View, Text, Input } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react-taro'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './login.scss'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useLoad(() => {
    console.log('Admin login page loaded')
  })

  const handleLogin = () => {
    if (!username || !password) {
      Taro.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      })
      return
    }

    // TODO: 调用登录 API
    Taro.showToast({
      title: '登录功能待实现',
      icon: 'none'
    })
  }

  return (
    <View className='admin-login'>
      <View className='login-card'>
        <Text className='title'>店主登录</Text>

        <View className='form'>
          <View className='form-item'>
            <Text className='label'>用户名</Text>
            <Input
              className='input'
              type='text'
              placeholder='请输入用户名'
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>

          <View className='form-item'>
            <Text className='label'>密码</Text>
            <Input
              className='input'
              type='password'
              password
              placeholder='请输入密码'
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            type='primary'
            size='large'
            className='btn-login'
            onClick={handleLogin}
          >
            登录
          </Button>
        </View>
      </View>
    </View>
  )
}
