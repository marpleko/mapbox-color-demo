<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import MapStyleFactory from '../utils/MapStyleFactory';
const baseUrl = window.location.origin;
const props = defineProps({
  modelValue: Object,
  mapStyle: String,
  isAddNewLayer: Boolean,
  isMotorwayChangeProperty: Boolean,
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  //'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  //'ncdrStyle': import.meta.env.VITE_ncdrStyle,
  'satelliteStyle': [import.meta.env.VITE_satelliteStyle, import.meta.env.VITE_CARoadStyle]
}
const emit = defineEmits(['update:modelValue']);
const mapContainer = ref(null);
const map = ref(null);
const mapStyleFactory = new MapStyleFactory({
  styles: styles
});


watch(
  () => props.mapStyle,
  async (newStyle) => {
    if (map.value) {
      try {
        await map.value.changeBaseMap(newStyle);
      } catch (error) {
        console.error('Error changing map style:', error);
      }
    }
  }
);

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

watch(
  () => props.isAddNewLayer,
  () => {

    if (map.value.isStyleLoaded()) {
      handleStyleLoad();
    }
  }
)
watch(
  () => props.isMotorwayChangeProperty,
  () => {
    console.log(map.value)
    if (props.mapStyle == 'mapboxStyle') {
      const layers = [
        'mapboxStyle-tunnel-motorway-trunk',
        'mapboxStyle-road-motorway-trunk',
        'mapboxStyle-bridge-motorway-trunk',
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
onMounted(async () => {
  const { lng, lat, zoom, bearing, pitch } = props.modelValue;
  map.value = await mapStyleFactory.createMap({
    container: mapContainer.value,
    options: {
      center: [lng, lat],
      bearing,
      pitch,
      zoom
    },
    defaultStyle: props.mapStyle,
    switchMode: 'remove'
  })
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