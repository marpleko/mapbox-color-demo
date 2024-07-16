<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

const props = defineProps({
  modelValue: Object,
  mapStyle: String,
  isChangeProperty: Boolean
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle
}
const emit = defineEmits(['update:modelValue']);
const mapContainer = ref(null);
const map = ref(null);
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;

watch(
  () => props.isChangeProperty,
  () => {
    const layers = [
      'tunnel_trunk_primary_casing',
      'tunnel_trunk_primary',
      'bridge_trunk_primary',
      'road_trunk_primary',
      'road_trunk_primary_casing',
      'bridge_trunk_primary_casing'
    ];

    layers.forEach(layer => {
      map.value.setPaintProperty(layer, 'line-opacity', 0.2);
      map.value.setPaintProperty(layer, 'line-color', 'hsl(0, 100%, 50%)');

    });
  }
);

watch(
  () => props.mapStyle,
  (newStyle) => {
    if (map.value) {
      map.value.setStyle(styles[newStyle]);
    }
  }
);

onMounted(() => {
  const { lng, lat, zoom, bearing, pitch } = props.modelValue;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: styles[props.mapStyle],
    center: [lng, lat],
    bearing,
    pitch,
    zoom
  });

  map.value.addControl(new mapboxgl.NavigationControl());



});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<style>
.map-container {
  flex: 1;
}

.mapboxgl-popup-content {
  color: black
}
</style>