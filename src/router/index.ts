import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils/request'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    meta: { title: '登录' },
    component: () => import('@/views/Login/LoginData.vue')
  },
  {
    path: '/home',
    name: 'home',
    meta: { title: '设备运维' },
    component: () => import('@/views/Home/HomeData.vue')
  },
  { path: '/:pathMatch(.*)*', name: 'NoFount', component: () => import('@/components/Error/404.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/** 简单登录守卫：未登录时访问受保护页面跳回登录 */
router.beforeEach((to) => {
  if (to.path !== '/login' && !getToken()) return { path: '/login' }
  if (to.path === '/login' && getToken()) return { path: '/home' }
  return true
})

export default router
