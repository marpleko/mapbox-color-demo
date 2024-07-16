import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'mapbox-gl/dist/mapbox-gl.css';
import router from './router'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)
app.use(router)
app.use(pinia)
app.mount('#app')