<template>
  <div id="layout">
    <div id="sidebar">
      <div>
        <h2>底圖 CA</h2>
      </div>
      <div>
        <h2>樣式調整 </h2>
        <table>
          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
              <!-- <th>寬度</th> -->
            </tr>
          </thead>
          <tbody>
            <td> 省道 </td>
            <td> <input type="color" class="color-picker" v-model="layerProperty.provincial.lineColor" /></td>
            <!-- <td> <input type="number" v-model="layerProperty.provincial.lineWidth" /></td> -->
          </tbody>

          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
              <th>文字大小</th>
            </tr>
          </thead>
          <tbody>
            <td> 省道註記文字 </td>
            <td> <input type="color" class="color-picker" v-model="layerProperty.roadText.textColor" /></td>
            <td> <input type="number" v-model="layerProperty.roadText.textSize" /></td>
          </tbody>

          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
              <th>虛線間隔</th>
            </tr>
          </thead>
          <tbody>
            <td> 行政界 </td>
            <td> <input type="color" class="color-picker" v-model="layerProperty.administrative.lineColor" /></td>
            <td><input type="number" v-model="layerProperty.administrative.lineDasharray[0]" /> <input type="number"
                v-model="layerProperty.administrative.lineDasharray[1]" /></td>
          </tbody>

          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
              <th>文字大小</th>
            </tr>
          </thead>
          <tbody>
            <td> 行政界註記文字 </td>
            <td><input type="color" class="color-picker" v-model="layerProperty.adminText.textColor" /> </td>
            <td><input type="number" v-model="layerProperty.adminText.textSize" /> </td>
          </tbody>

          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
            </tr>
          </thead>
          <tbody>
            <td> 公園 </td>
            <td> <input type="color" class="color-picker" v-model="layerProperty.park.fillColor" /> </td>
          </tbody>
        </table>
      </div>
    </div>

    <Map :modelValue="location" :mapStyle="mapStyle" :layerProperty="layerProperty"
      @update:layerProperty="updateLayerProperty" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map from '../maps/DemoMap.vue';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapStyle = ref('CAStyle');

const layerProperty = ref({
  provincial: { lineColor: '#FF0000', lineWidth: { base: 1.2, stops: [] } },
  roadText: { textColor: '#000000', textSize: 12 },
  administrative: { lineColor: '#0000FF', lineDasharray: [2, 2] },
  adminText: { textColor: '#000000', textSize: 10 },
  park: { fillColor: '#00FF00' }
});

const updateLayerProperty = (newProperty) => {
  console.log(newProperty);
  for (const key in newProperty) {
    if (newProperty[key].lineColor) {
      newProperty[key].lineColor = normalizeColor(newProperty[key].lineColor);
    }
    if (newProperty[key].textColor) {
      newProperty[key].textColor = normalizeColor(newProperty[key].textColor);
    }
    if (newProperty[key].fillColor) {
      newProperty[key].fillColor = normalizeColor(newProperty[key].fillColor);
    }
  }
  layerProperty.value = newProperty;
};
function normalizeColor(color) {
  // 如果已經是 #rrggbb 格式，直接返回
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  // 創建一個臨時的 canvas 元素
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  // 將顏色設置為 canvas 的填充樣式
  ctx.fillStyle = color;

  // 如果設置失敗，說明不是有效的顏色格式
  if (ctx.fillStyle === '#000000' && color !== 'black' && color !== '#000000') {
    console.warn(`無效的顏色格式: ${color}`);
    return null;
  }

  // 繪製一個像素
  ctx.fillRect(0, 0, 1, 1);

  // 獲取該像素的顏色數據
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

  // 轉換為十六進制並返回
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
const initialLocation = {
  lng: 121,
  lat: 23.5,
  bearing: 0,
  pitch: 0,
  zoom: 7
};

const location = ref(initialLocation);
function hslToHex(hslColor) {
  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return hslColor; // 如果不是有效的 HSL 格式，直接返回原值

  let h = parseInt(hslMatch[1]) / 360;
  let s = parseInt(hslMatch[2]) / 100;
  let l = parseInt(hslMatch[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
onMounted(() => {
  // 如果需要在這裡執行一些初始化操作
});

</script>

<style>
input[type="number"] {
  width: 30px;
}

#layout {
  flex: 1;
  display: flex;
}

#sidebar {
  background-color: rgb(35 55 75 / 90%);
  color: #fff;
  padding: 6px 12px;
  font-family: monospace;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 155px;
  margin: 12px;
  border-radius: 4px;
}

.color-picker {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}

.range-slider {
  width: 80px;

  opacity: 0.7;
  transition: opacity .2s;

}

.range-slider:hover {
  opacity: 1;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  cursor: pointer;
  border-radius: 50%;
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4CAF50;
  cursor: pointer;
  border-radius: 50%;
}
</style>