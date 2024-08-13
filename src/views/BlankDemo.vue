<template>
  <div id="layout">
    <div id="sidebar">
      <div>

      </div>
    </div>
    <Map :modelValue="location" :mapStyle="mapStyle" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Map from '../maps/BlankDemoMap.vue';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapStyle = ref('mapboxStyle');
const styles = ['mapboxStyle']

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
