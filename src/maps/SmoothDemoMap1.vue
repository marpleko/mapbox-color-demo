<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

const props = defineProps({
  modelValue: Object,
  mapStyle: String,
  isAddNewLayer: Boolean,
  isMotorwayChangeProperty: Boolean,
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle,
  'satelliteStyle': import.meta.env.VITE_CARoadStyle
}
const emit = defineEmits(['update:modelValue']);
const mapContainer = ref(null);
const map = ref(null);
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;

watch(
  () => props.isAddNewLayer,
  () => {
    map.value.off('style.load', handleStyleLoad);
    function handleStyleLoad() {
      if (!map.value.getSource('soilLiquefactionPotential')) {
        map.value.addSource('soilLiquefactionPotential', {
          type: 'geojson',
          data: 'soilLiquefactionPotential.geojson'
        });
      }
      if (!map.value.getLayer('soilLiquefactionPotential-layer')) {
        map.value.addLayer({
          id: 'soilLiquefactionPotential-layer',
          type: 'fill',
          source: 'soilLiquefactionPotential',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'class'], '3'], '#00ff00',
              ['==', ['get', 'class'], '2'], '#ffff00',
              ['==', ['get', 'class'], '1'], '#ff0000',
              '#000000'
            ],
          },
        });
      }
    }
    map.value.on('style.load', handleStyleLoad);

    if (map.value.isStyleLoaded()) {
      handleStyleLoad();
    }
  }
)


watch(
  () => props.mapStyle,
  (newStyle) => {
    if (map.value) {
      map.value.setStyle(styles[newStyle]);

      if (newStyle == 'satelliteStyle') {
        console.log(newStyle)
        console.log(map.value)
        map.value.on('load', () => {
          map.value.addImport({ id: 'satellite1', url: import.meta.env.VITE_satelliteStyle }, 'tunnel_motorway_link_casing');
        });
      }
    }
  }
);
watch(
  () => props.isMotorwayChangeProperty,
  () => {
    console.log(map.value)
    if (props.mapStyle == 'mapboxStyle') {
      const layers = [
        'tunnel-motorway-trunk',
        'road-motorway-trunk',
        'bridge-motorway-trunk',
      ];
      if (props.isMotorwayChangeProperty) {
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
  map.value.on('load', () => {
    map.value.addImport({ id: 'satellite', url: import.meta.env.VITE_satelliteStyle }, "tunnel_motorway_link_casing");
  });
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