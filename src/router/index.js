import { createRouter, createWebHistory } from 'vue-router'
import ColorDemo from '../views/ColorDemo.vue'
import LayerDemo from '../views/LayerDemo.vue'
import ColorChoose from '../views/ColorChoose.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LayerDemo
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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router