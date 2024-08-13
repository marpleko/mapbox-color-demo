<template>
  <div ref="mapContainer" class="map-container"></div>



</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

const props = defineProps({
  modelValue: Object,
  mapStyle: String,
  isMotorwayChangeProperty: Boolean,
  isPrimaryChangeProperty: Boolean
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
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;

watch(
  () => props.isMotorwayChangeProperty,
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

    if (props.isMotorwayChangeProperty) {
      layers.forEach(layer => {
        map.value.setPaintProperty(layer, 'line-opacity', 0.6);
        map.value.setPaintProperty(layer, 'line-color', 'hsl(0, 100%, 50%)');

      });
    } else {
      layers.forEach(layer => {
        map.value.setPaintProperty(layer, 'line-opacity', 0.5);
        map.value.setPaintProperty(layer, 'line-color', 'rgb(139, 165, 193)');

      });
    }

  }
);

watch(
  () => props.isPrimaryChangeProperty,
  () => {
    // const layers = [
    //   'tunnel_trunk_primary',
    //   'road_trunk_primary',
    //   'bridge_trunk_primary'
    // ];

    // layers.forEach(layerId => {
    //   // 確認圖層存在
    //   if (map.value.getLayer(layerId)) {
    //     // 獲取並解析圖層的過濾條件
    //     const filter = map.value.getFilter(layerId);
    //     console.log(map.value)
    //     console.log(filter)
    //     // 檢查過濾條件是否包含 "primary"

    //     // 根據 isChangeProperty 屬性調整顏色和透明度
    //     if (props.isChangeProperty) {
    //       map.value.setPaintProperty(layerId, 'line-opacity', 0.2);
    //       map.value.setPaintProperty(layerId, 'line-color', 'hsl(0, 100%, 50%)');
    //     } else {
    //       map.value.setPaintProperty(layerId, 'line-opacity', 1);
    //       map.value.setPaintProperty(layerId, 'line-color', '#fc8');
    //     }
    //   }
    // });
    map.value.addLayer({
      "id": "tunnel_primary",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["==", "brunnel", "tunnel"], ["==", "class", "primary"]],
      "layout": { "line-join": "round" },
      "paint": {
        "line-color": "#FF0000",
        "line-width": { "base": 1.2, "stops": [[5, 0], [7, 1], [20, 18]] }
      }
    });
    map.value.addLayer({
      "id": "road_primary",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "filter": ["all", ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "primary"]],
      "layout": { "line-join": "round" },
      "paint": {
        "line-color": "#FF0000",
        "line-width": { "base": 1.2, "stops": [[5, 0], [7, 1], [20, 18]] }
      }
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

  // Initialize the map
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: '/mapbox-color-demo/osm_liberty_NLSC_toNick_boundary.json',
    center: [lng, lat],
    bearing,
    pitch,
    zoom
  });

  map.value.addControl(new mapboxgl.NavigationControl());

  map.value.on('load', () => {
    map.value.addImport({ id: 'satellite', url: import.meta.env.VITE_satelliteStyle }, "basemap");
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