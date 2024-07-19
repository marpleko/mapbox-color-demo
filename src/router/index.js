import { createRouter, createWebHistory } from 'vue-router'
import ColorDemo from '../views/ColorDemo.vue'
import LayerDemo from '../views/LayerDemo.vue'
import ColorChoose from '../views/ColorChoose.vue'
import satelliteDemo from '../views/satelliteDemo.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ColorDemo
  },
  {
    path: '/color-demo',
    name: 'ColorDemo',
    component: ColorDemo
  },
  {
    path: '/layer-demo',
    name: 'LayerDemo',
    component: LayerDemo
  },
  {
    path: '/color-choose',
    name: 'ColorChoose',
    component: ColorChoose
  },
  {
    path: '/satellite-demo',
    name: 'satelliteDemo',
    component: satelliteDemo
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})
export default router