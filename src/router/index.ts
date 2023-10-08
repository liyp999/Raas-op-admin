import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
// import NProgress from 'nprogress'
// import 'nprogress/nprogress.css'
const routes: RouteRecordRaw[] = [{
    path: '/',
    redirect: '/login'
},
{
    path: '/login',
    name: 'login',
    meta: { tittle: '登录' },
    component: () => import('@/views/Login/LoginData.vue')
},
{
    path: '/home',
    name: 'home',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/views/Home/HomeData.vue')
},
{ path: '/:pathMatch(.*)*', name: 'NoFount', component: () => import('@/components/Error/404.vue') }]
// import.meta.env.BASE_URL
const router = createRouter({
    history: createWebHistory(),
    routes: routes
})
// router.beforeEach(async (to, from) => {
//     NProgress.start()
// })
// router.afterEach(to => {
//     NProgress.done()
// })
export default router