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
      // 'tunnel_motorway_link_casing',
      // 'tunnel_motorway_casing',
      'tunnel_motorway_link',
      'tunnel_motorway',
      // 'road_motorway_link_casing',
      // 'road_motorway_casing',
      'road_motorway_link',
      'road_motorway',
      // 'bridge_motorway_link_casing',
      // 'bridge_motorway_casing',
      'bridge_motorway_link',
      'bridge_motorway',
    ];
    if (props.isChangeProperty) {
      layers.forEach(layer => {
        map.value.setPaintProperty(layer, 'line-opacity', 0.2);
        map.value.setPaintProperty(layer, 'line-color', 'hsl(0, 100%, 50%)');

      });
    } else {
      layers.forEach(layer => {
        map.value.setPaintProperty(layer, 'line-opacity', 1);
        map.value.setPaintProperty(layer, 'line-color', '#fc8');

      });
    }

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