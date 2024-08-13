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
  layerColors: Object,
  layerOpacity: Object
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle
}

const emit = defineEmits(['update:layerColors']);
const mapContainer = ref(null);
const map = ref(null);
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;

const targetLayer = {
  "primary": {
    "layers": {
      "casing": [],
      "layers": []
    },
    "feature": ["line-width", "line-color"]
  },
  "motorway": {
    "layers": {
      "casing": [],
      "layers": []
    },
    "feature": ["line-width", "line-color"]
  },
  "secondary": {
    "layers": {
      "casing": [],
      "layers": []
    },
    "feature": ["line-width", "line-color"]
  },
  "boundary_city": {
    "layers": [],
    "feature": ["line-color", "line-dasharray", "text-size", "text-color"]
  },
  "grass": {
    "layers": [],
    "feature": ["fill-color", "text-size", "text-color"]
  },
  "rail": {
    "layers": {
      "hatching": [],
      "layers": []
    },
    "feature": ["line-width", "line-color"]
  }
};

/**
 * 處理地圖樣式，根據圖層類型和子類型過濾並填充 targetLayer 的 layers。
 * @param {Object} mapStyle - 從地圖樣式 API 獲取的地圖樣式對象。
 * @param {String} styleName - 樣式名稱。
 */
const processMapStyle = (mapStyle, styleName) => {
  Object.keys(targetLayer).forEach(layerType => {
    const allLayers = mapStyle.layers
      .filter(layer => layer.id.includes(layerType))
      .map(layer => layer.id);

    console.log(`${layerType} layers類型:`, Array.isArray(targetLayer[layerType].layers) ? 'array' : 'object');

    if (!Array.isArray(targetLayer[layerType].layers)) {
      Object.keys(targetLayer[layerType].layers).forEach(subType => {
        if (subType === 'layers') {
          targetLayer[layerType].layers[subType] = allLayers.filter(layer =>
            !Object.keys(targetLayer[layerType].layers)
              .filter(key => key !== 'layers')
              .some(key => layer.includes(key))
          );
        } else {
          targetLayer[layerType].layers[subType] = allLayers.filter(layer => layer.includes(subType));
        }
      });
    } else {
      targetLayer[layerType].layers = allLayers;
    }
  });
  console.log('處理後的 targetLayer:', JSON.stringify(targetLayer, null, 2));
};
const fetchMapStyle = async (styleUrl, styleName) => {
  try {
    const response = await axios.get(styleUrl);
    const mapStyle = response.data;
    console.log(mapStyle);
    processMapStyle(mapStyle, styleName);
  } catch (error) {
    console.error('Error loading the map style:', error);
  }
};

watch(
  () => props.mapStyle,
  async (newStyle) => {
    console.log(styles[newStyle]);
    await fetchMapStyle(styles[newStyle], newStyle);

    if (map.value) {
      map.value.setStyle(styles[newStyle]);
      map.value.on('load', () => {
        getInitialColors();
      });
    }
  }
);

watch(
  () => ({ ...props.layerColors }),
  (newColor, oldColor) => {
    console.log('Layer colors changed:', newColor);

    if (props.mapStyle && targetLayer) {
      Object.entries(newColor).forEach(([key, color]) => {
        if (!oldColor || color !== oldColor[key]) {
          console.log(`Layer color changed: ${key}, New value: ${color}, Old value: ${oldColor?.[key]}`);

          Object.keys(targetLayer).forEach(layerType => {
            const layerGroup = targetLayer[layerType].layers[key];
            if (layerGroup) {
              if (Array.isArray(layerGroup)) {
                layerGroup.forEach(layer => {
                  map.value.setPaintProperty(layer, 'line-color', color);
                });
              } else {
                Object.values(layerGroup).flat().forEach(layer => {
                  map.value.setPaintProperty(layer, 'line-color', color);
                });
              }
            }
          });
        }
      });
    }
  },
  { deep: true }
);

const calculateNormalizedOpacity = (opacity) => {
  const parsedOpacity = parseFloat(opacity);
  return (100 - parsedOpacity) / 100;
};

watch(
  () => ({ ...props.layerOpacity }),
  (newOpacity, oldOpacity) => {
    console.log('Layer opacities changed:', newOpacity);

    if (props.mapStyle && targetLayer) {
      Object.entries(newOpacity).forEach(([key, opacity]) => {
        if (!oldOpacity || opacity !== oldOpacity[key]) {
          console.log(`Layer opacity changed: ${key}, New value: ${opacity}, Old value: ${oldOpacity?.[key]}`);

          Object.keys(targetLayer).forEach(layerType => {
            const layerGroup = targetLayer[layerType].layers[key];
            if (layerGroup) {
              if (Array.isArray(layerGroup)) {
                layerGroup.forEach(layer => {
                  map.value.setPaintProperty(layer, 'line-opacity', calculateNormalizedOpacity(opacity));
                });
              } else {
                Object.values(layerGroup).flat().forEach(layer => {
                  map.value.setPaintProperty(layer, 'line-opacity', calculateNormalizedOpacity(opacity));
                });
              }
            }
          });
        }
      });
    }
  },
  { deep: true }
);

const getInitialColors = () => {
  if (!map.value) return;

  const initialColors = {};
  Object.keys(targetLayer).forEach(layerType => {
    if (Array.isArray(targetLayer[layerType].layers)) {
      targetLayer[layerType].layers.forEach(layerId => {
        const color = map.value.getPaintProperty(layerId, 'line-color');
        if (color) {
          initialColors[layerId] = color;
        }
      });
    } else {
      Object.keys(targetLayer[layerType].layers).forEach(subType => {
        targetLayer[layerType].layers[subType].forEach(layerId => {
          const color = map.value.getPaintProperty(layerId, 'line-color');
          if (color) {
            initialColors[layerId] = color;
          }
        });
      });
    }
  });

  emit('update:layerColors', initialColors);
};

onMounted(async () => {
  const { lng, lat, zoom, bearing, pitch } = props.modelValue;
  try {
    await fetchMapStyle(styles[props.mapStyle], props.mapStyle);

  } catch (error) {
    console.error('Error initializing map:', error);
  }
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
    getInitialColors();
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