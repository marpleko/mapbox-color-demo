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
        <h2>圖層套疊 </h2>
        <table>
          <thead>
            <tr>
              <th>圖層名稱</th>
              <th>透明度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(transparency, key) in layerTransparency" :key="key">
              <td>
                <input type="checkbox" v-model="selectedLayers[key]" />{{ layerZH[key] }}
              </td>
              <td>
                <input type="text" v-model.lazy="layerTransparency[key]"
                  @change="updateMapTransparency(key, layerTransparency[key])" />%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Map :modelValue="location" :mapStyle="mapStyle" :selectedLayers="selectedLayers"
      :layerTransparency="layerTransparency" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map from '../maps/LayerDemoMap.vue';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapStyle = ref('mapboxStyle');
const styles = ['mapboxStyle', 'maptilerStyle', 'ncdrStyle']
const layerTransparency = ref({
  'industrialAreaScope': '0',
  'earthquake': '0',
  'riceCrop': '30',
  'soilLiquefactionPotential': '0',
  'countyCityBoundariesGeoJSON': '0',
  'countyCityBoundariesSymbol': '0',
});

const layerZH = {
  'industrialAreaScope': '工業區範圍',
  'earthquake': '地震',
  'riceCrop': '水稻作物',
  'soilLiquefactionPotential': '土壤液化潛勢',
  'countyCityBoundariesGeoJSON': '縣市區界',
  'countyCityBoundariesSymbol': '縣市區界',
}

const selectedLayers = ref({
  'industrialAreaScope': true,
  'earthquake': true,
  'riceCrop': true,
  'soilLiquefactionPotential': true,
  'countyCityBoundariesGeoJSON': true,
  'countyCityBoundariesSymbol': true
});

const initialLocation = {
  lng: 121,
  lat: 23.5,
  bearing: 0,
  pitch: 0,
  zoom: 7
};

const updateMapTransparency = (layerKey, transparency) => {
  console.log(layerTransparency)
  if (transparency === '' || isNaN(transparency)) {
    transparency = 100;
  } else {
    transparency = Math.min(Math.max(parseInt(transparency), 0), 100);
  }

  layerTransparency.value[layerKey] = transparency.toString();
}

const location = ref(initialLocation);
onMounted(() => {
  Object.keys(layerTransparency.value).forEach(key => {
    updateMapTransparency(key, layerTransparency.value[key]);
  });
});
// const resetLocation = () => {
//   location.value = initialLocation;
// };

// const updateLocation = (newLocation) => {
//   location.value = newLocation;
// };

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
</style>
