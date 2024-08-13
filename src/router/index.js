import { createRouter, createWebHistory } from 'vue-router'
import ColorDemo from '../views/ColorDemo.vue'
import LayerDemo from '../views/LayerDemo.vue'
import ColorChoose from '../views/ColorChoose.vue'
import SatelliteDemo from '../views/SatelliteDemo.vue'
import MaintainLayerDemo from '../views/MaintainLayerDemo.vue'
import BlankDemo from '../views/BlankDemo.vue'
import ImportDemoMap from '../views/ImportDemo.vue'
import Demo from '../views/Demo.vue'
import SmoothDemo from '../views/SmoothDemo.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ColorDemo
  },
  {
    path: '/demo',
    name: 'Demo',
    component: Demo
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
    name: 'SatelliteDemo',
    component: SatelliteDemo
  },
  {
    path: '/maintainLayer-demo',
    name: 'MaintainLayerDemo',
    component: MaintainLayerDemo
  },
  {
    path: '/blank-demo',
    name: 'BlankDemo',
    component: BlankDemo
  },  
  {
    path: '/import-demo',
    name: 'ImportDemoMap',
    component: ImportDemoMap
  },
  {
    path: '/smooth-demo',
    name: 'SmoothDemo',
    component: SmoothDemo
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})
export default router