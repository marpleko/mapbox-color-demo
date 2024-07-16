<template>
  <div id="layout">
    <div id="sidebar">
      <div>
        <h2>底圖 </h2>
        <select v-model="mapStyle">
          <option v-for="(style, key) in styles" :key="key" :value="style">{{ style }}</option>
        </select>
      </div>
      <div>
        <h2>樣式調整 </h2>
        <table>
          <thead>
            <tr>
              <th>樣式名稱</th>
              <th>顏色</th>
              <th>透明度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(opacity, key) in layerOpacity" :key="key">
              <td>
                {{ layerZH[key] }}
              </td>
              <td>
                <input type="color" class="color-picker" v-model="layerColors[key]"
                  @input="updateMapColor(key, layerColors[key])" />
              </td>
              <td>
                <input type="range" class="range-slider" v-model="layerOpacity[key]" min="0" max="100" step="10"
                  @input="updateMapOpacity(key, layerOpacity[key])" />{{ layerOpacity[key] }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Map :modelValue="location" :mapStyle="mapStyle" :layerColors="layerColors" :layerOpacity="layerOpacity"
      @update:layerColors="updateInitialColors" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map from '../maps/ColorChooseMap.vue';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapStyle = ref('CAStyle');
const styles = ['mapboxStyle', 'CAStyle']
const layerOpacity = ref({
  'motorway': '0',
  'primary': '0',
  'secondary': '0',
});

const layerColors = ref({
  'motorway': hslToHex('hsl(220, 20%, 97%)'),
  'primary': hslToHex('hsl(220, 13%, 72%)'),
  'secondary': hslToHex('hsl(220, 13%, 72%)'),
});

const layerZH = {
  'motorway': '國道',
  'primary': '省道',
  'secondary': '縣道',
}

const selectedLayers = ref({
  'motorway': true,
  'primary': true,
  'secondary': true,
});

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

// Hex to HSL 轉換函數
function hexToHsl(hexColor) {
  // 移除 # 符號（如果有的話）
  hexColor = hexColor.replace(/^#/, '');

  // 解析 hex 值
  const bigint = parseInt(hexColor, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // 轉換為 0-1 範圍
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // 灰度
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}


const initialLocation = {
  lng: 121,
  lat: 23.5,
  bearing: 0,
  pitch: 0,
  zoom: 7
};

const updateMapOpacity = (layerKey, opacity) => {
  console.log(layerOpacity)
  if (opacity === '' || isNaN(opacity)) {
    opacity = 100;
  } else {
    opacity = Math.min(Math.max(parseInt(opacity), 0), 100);
  }

  layerOpacity.value[layerKey] = opacity.toString();
}

const updateMapColor = (layerKey, hslColor) => {
  const hexColor = hslToHex(hslColor);
  layerColors.value[layerKey] = hexColor;
  console.log(`Updated color for ${layerKey}: ${hexColor}`);
};

const updateInitialColors = (colors) => {
  Object.keys(colors).forEach(key => {
    if (layerColors.value.hasOwnProperty(key)) {
      layerColors.value[key] = colors[key];
    }
  });
};

const location = ref(initialLocation);
onMounted(() => {
  Object.keys(layerOpacity.value).forEach(key => {
    updateMapOpacity(key, layerOpacity.value[key]);
  });


});

</script>


<style>
input[type="text"] {
  width: 50px;
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
