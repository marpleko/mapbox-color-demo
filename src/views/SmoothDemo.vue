<template>
  <div id="layout">
    <div id="sidebar">
      <div>
        <table>
          <tr>
            <td>setstyle</td>
            <td>remove</td>
          </tr>
          <tr>
            <td>visible</td>
            <td>opacity</td>
          </tr>
        </table>
        <h2>底圖 </h2>
        <select v-model="mapStyle">
          <option v-for="(style, key) in styles" :key="key" :value="style">{{ style }}</option>
        </select>
        <div><button @click="addNewLayer">add new layer</button></div>
        <div>
          <button @click="changeMotorwayColor">國道顏色變紅透明度80%</button>
        </div>
      </div>
    </div>
    <div id="map-container">
      <Map1 :modelValue="location" :mapStyle="mapStyle" :isAddNewLayer="isAddNewLayer"
        :isMotorwayChangeProperty="isMotorwayChangeProperty" />
      <Map2 :modelValue="location" :mapStyle="mapStyle" :isAddNewLayer="isAddNewLayer"
        :isMotorwayChangeProperty="isMotorwayChangeProperty" />
      <Map3 :modelValue="location" :mapStyle="mapStyle" :isAddNewLayer="isAddNewLayer"
        :isMotorwayChangeProperty="isMotorwayChangeProperty" />
      <Map4 :modelValue="location" :mapStyle="mapStyle" :isAddNewLayer="isAddNewLayer"
        :isMotorwayChangeProperty="isMotorwayChangeProperty" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map1 from '../maps/SmoothDemoMap1.vue';
import Map2 from '../maps/SmoothDemoMap2.vue';
import Map3 from '../maps/SmoothDemoMap3.vue';
import Map4 from '../maps/SmoothDemoMap4.vue';
import 'mapbox-gl/dist/mapbox-gl.css';
const isAddNewLayer = ref(false)
const isMotorwayChangeProperty = ref(false)
const changeMotorwayColor = () => {
  isMotorwayChangeProperty.value = !isMotorwayChangeProperty.value;
};
const addNewLayer = () => {
  isAddNewLayer.value = !isAddNewLayer.value;
};
const mapStyle = ref('satelliteStyle');
const styles = ['satelliteStyle', 'mapboxStyle', 'CAStyle']

const initialLocation = {
  lng: 121.5,
  lat: 25.04,
  bearing: 0,
  pitch: 50,
  zoom: 11
};

const location = ref(initialLocation);
onMounted(() => {

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

#map-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  padding: 10px;
}

#map-container>* {
  width: 100%;
  height: 100%;
}
</style>
