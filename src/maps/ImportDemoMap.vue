<template>
  <div ref="mapContainer" class="map-container"></div>



</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';

const props = defineProps({
  modelValue: Object,
  mapStyle: String,
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle,
  'satelliteStyle': import.meta.env.VITE_satelliteStyle
}
const emit = defineEmits(['update:modelValue']);
const mapContainer = ref(null);
const map = ref(null);
const baseUrl = ref('');

mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;
const addedLayerIds = ref({});
const previousStyle = ref(null);

watch(
  () => props.mapStyle,
  (newStyle) => {
    if (map.value) {
      console.log('Changing style to:', newStyle);



      if (!addedLayerIds.value[newStyle]) {
        addedLayerIds.value[newStyle] = [];
      }
      axios.get(styles[newStyle])
        .then(response => {
          const mapStyle = response.data;
          Object.keys(mapStyle.sources).forEach(sourceName => {
            if (!map.value.getSource(sourceName)) {
              map.value.addSource(sourceName, mapStyle.sources[sourceName]);
            }
          });
          mapStyle.layers.forEach(layer => {
            if (!map.value.getLayer(layer.id)) {
              map.value.addLayer(layer, 'blank-layer');
              addedLayerIds.value[props.mapStyle].push(layer.id);
            }
          });

          console.log('Layers after update:', map);
        })
        .catch(error => {
          console.error('Error loading the map style:', error);
        });
      if (previousStyle.value && addedLayerIds.value[previousStyle.value]) {
        removeAddedLayers(previousStyle.value);
      }

      previousStyle.value = newStyle;
    }
    console.log('Currently added layers:', addedLayerIds);
    console.log(map.value.listImages());
  }
);


function removeAddedLayers(styleName) {
  if (addedLayerIds.value[styleName]) {
    addedLayerIds.value[styleName].forEach(layerId => {
      if (map.value.getLayer(layerId)) {
        map.value.removeLayer(layerId);
      }
    });
    addedLayerIds.value[styleName] = [];
  }
}



onMounted(() => {
  baseUrl.value = window.location.origin;
  const { lng, lat, zoom, bearing, pitch } = props.modelValue;
  const blankStyle = {
    version: 8,
    name: 'BlankMap',
    sources: {},
    layers: [
      {
        id: 'backgroundMap',
        type: 'background',
        paint: {
          'background-color': 'rgba(0, 0, 0, 0)'
        }
      }
    ],
    "glyphs": "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=Q1ccDNKktmjNBdazPWHD",
    //"sprite": `${baseUrl.value}/merged_image`,
  };

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: blankStyle,
    center: [lng, lat],
    bearing,
    pitch,
    zoom
  });
  map.value.addControl(new mapboxgl.NavigationControl());

  previousStyle.value = props.mapStyle;
  addedLayerIds.value[props.mapStyle] = [];

  axios.get(styles[props.mapStyle])
    .then(response => {
      const mapStyle = response.data;
      map.value.on('load', () => {
        Object.keys(mapStyle.sources).forEach(sourceName => {
          if (!map.value.getSource(sourceName)) {
            map.value.addSource(sourceName, mapStyle.sources[sourceName]);
          }
        });
        mapStyle.layers.forEach(layer => {
          if (!map.value.getLayer(layer.id)) {
            map.value.addLayer(layer);
            addedLayerIds.value[props.mapStyle].push(layer.id);
          }
        });
      });
      map.value.addImport({ id: 'road', url: '/mapbox-color-demo/streets-v12.json' });

      map.value.on('load', () => {
        map.value.addLayer({
          id: 'blank-layer',
          type: 'background',
          paint: {
            'background-color': 'rgba(255, 255, 255, 0)'
          }
        });
      });

    })
    .catch(error => {
      console.error('Error loading the map style:', error);
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