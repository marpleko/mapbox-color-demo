<template>
  <div id="layout">
    <div id="sidebar">
      <div>
        <button @click="changeMotorwayColor">國道顏色變紅透明度80%</button>
        <!-- <button @click="changePrimaryColor">省道顏色變紅透明度80%</button> -->
      </div>
    </div>
    <Map :modelValue="location" :mapStyle="mapStyle" :isMotorwayChangeProperty="isMotorwayChangeProperty"
      :isPrimaryChangeProperty="isPrimaryChangeProperty" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map from '../maps/satelliteDemoMap.vue';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapStyle = ref('satelliteStyle');
const styles = ['satelliteStyle']
const isMotorwayChangeProperty = ref(false)
const isPrimaryChangeProperty = ref(false)
const changePrimaryColor = () => {
  isPrimaryChangeProperty.value = !isPrimaryChangeProperty.value;
};
const changeMotorwayColor = () => {
  isMotorwayChangeProperty.value = !isMotorwayChangeProperty.value;
};
const initialLocation = {
  lng: 121,
  lat: 23.5,
  bearing: 0,
  pitch: 0,
  zoom: 7
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
</style>
