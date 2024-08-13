<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

const props = defineProps({
  modelValue: Object,
  mapStyle: String,
  layerProperty: Object,
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle
}

const emit = defineEmits(['update:layerProperty']);
const mapContainer = ref(null);
const map = ref(null);
const mapLoaded = ref(false);
let primaryColor = '';
let primaryWidth = 0;
let textColor = '';
let textSize = 0;

mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;

onMounted(async () => {
  const { lng, lat, zoom, bearing, pitch } = props.modelValue;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: styles[props.mapStyle],
    center: [lng, lat],
    bearing,
    pitch,
    zoom
  });
  console.log(map.value)
  map.value.addControl(new mapboxgl.NavigationControl());
  map.value.on('load', () => {
    mapLoaded.value = true;
    getInitialPropertys();
  });
});
const getInitialPropertys = () => {
  if (!map.value) return;

  const initialProperty = {
    provincial: {
      lineColor: '',
      lineWidth: 0
    },
    administrative: {
      lineColor: '',
      lineDasharray: []
    },
    park: {
      fillColor: ''
    },
    roadText: {
      textColor: '',
      textSize: 0
    },
    adminText: {
      textColor: '',
      textSize: 0
    }
  };

  // 省道
  initialProperty.provincial.lineColor = map.value.getPaintProperty('road_secondary_trunk_primary', 'line-color') || '';
  // map.value.setPaintProperty('road_secondary_trunk_primary', 'line-width', [
  //   'match',
  //   ['get', 'class'],
  //   'primary', 3
  // ])
  // initialProperty.provincial.lineWidth = map.value.getPaintProperty('road_secondary_trunk_primary', 'line-width') || 0;
  primaryColor = map.value.getPaintProperty('road_secondary_trunk_primary', 'line-color') || '';
  // primaryWidth = map.value.getPaintProperty('road_secondary_trunk_primary', 'line-width') || 0;
  // console.log(primaryWidth)
  // 行政界
  initialProperty.administrative.lineColor = map.value.getPaintProperty('boundary_city', 'line-color') || '';
  initialProperty.administrative.lineDasharray = map.value.getPaintProperty('boundary_city', 'line-dasharray') || [];

  // 公園
  initialProperty.park.fillColor = map.value.getPaintProperty('landcover_grass', 'fill-color') || '';

  // 道路文字
  initialProperty.roadText.textColor = map.value.getPaintProperty('road_label', 'text-color') || '';
  initialProperty.roadText.textSize = map.value.getLayoutProperty('road_label', 'text-size') || 0;
  textColor = map.value.getPaintProperty('road_label', 'text-color') || '';
  textSize = map.value.getLayoutProperty('road_label', 'text-size') || 0;

  // 行政區文字
  initialProperty.adminText.textColor = map.value.getPaintProperty('place_city', 'text-color') || '';
  map.value.setLayoutProperty('place_city', 'text-size', 16)
  initialProperty.adminText.textSize = map.value.getLayoutProperty('place_city', 'text-size') || 0;

  emit('update:layerProperty', initialProperty);
};
watch(
  () => ({ ...props.layerProperty }),
  (newProps, oldProps) => {
    console.log('newProps', newProps)
    const updateLayerProperties = (layers, property, value) => {
      layers.forEach(layerId => {
        if (map.value && map.value.getLayer(layerId)) {
          try {
            map.value.setPaintProperty(layerId, property, value);
          } catch (error) {
            console.warn(`無法設置圖層 ${layerId} 的 ${property} 屬性:`, error);
          }
        }
      });
    };

    const updateTextSize = (layers, size) => {
      layers.forEach(layerId => {
        if (map.value && map.value.getLayer(layerId)) {
          try {
            map.value.setLayoutProperty(layerId, 'text-size', size);
          } catch (error) {
            console.warn(`無法設置圖層 ${layerId} 的文字大小:`, error);
          }
        }
      });
    };

    if (map.value) {
      updateLayerProperties(
        ['tunnel_secondary_trunk_primary', 'bridge_secondary_trunk_primary', 'road_secondary_trunk_primary'],
        'line-color',
        [
          'match',
          ['get', 'class'],
          'primary', newProps.provincial.lineColor,
          primaryColor
        ]
      );

      updateLayerProperties(
        ['boundary_city'],
        'line-color',
        newProps.administrative.lineColor
      );

      updateLayerProperties(
        ['landcover_grass'],
        'fill-color',
        newProps.park.fillColor
      );

      // updateLayerProperties(
      //   ['tunnel_trunk_primary', 'bridge_trunk_primary', 'road_trunk_primary'],
      //   'line-width',
      //   [
      //     'match',
      //     ['get', 'class'],
      //     'primary', newProps.provincial.lineWidth,
      //     primaryWidth
      //   ]
      // );

      updateLayerProperties(
        ['boundary_city'],
        'line-dasharray',
        newProps.administrative.lineDasharray
      );

      updateLayerProperties(
        ['road_label'],
        'text-color',
        [
          'match',
          ['get', 'ref_length'],
          3, newProps.roadText.textColor,
          4, newProps.roadText.textColor,
          textColor
        ]
      );

      updateLayerProperties(
        ['place_city'],
        'text-color',
        newProps.adminText.textColor
      );

      updateTextSize(
        ['road_label'],
        [
          'match',
          ['get', 'ref_length'],
          3, newProps.roadText.textSize,
          4, newProps.roadText.textSize,
          textSize
        ]
      );

      updateTextSize(
        ['place_city'],
        newProps.adminText.textSize
      );
    }
  },
  { deep: true }
);

// watch(
//   () => ({ ...props.layerProperty }),
//   (newProps, oldProps) => {
//     console.log('newProps', newProps)
//     if (!mapLoaded.value || !map.value) return;

//     const updateLayerProperties = (layers, property, value) => {
//       layers.forEach(layerId => {
//         if (map.value.getLayer(layerId)) {
//           try {
//             map.value.setPaintProperty(layerId, property, value);
//           } catch (error) {
//             console.warn(`無法設置圖層 ${layerId} 的 ${property} 屬性:`, error);
//           }
//         }
//       });
//     };

//     const updateTextSize = (layers, size) => {
//       layers.forEach(layerId => {
//         if (map.value.getLayer(layerId)) {
//           try {
//             map.value.setLayoutProperty(layerId, 'text-size', size);
//           } catch (error) {
//             console.warn(`無法設置圖層 ${layerId} 的文字大小:`, error);
//           }
//         }
//       });
//     };

//     updateLayerProperties(
//       ['tunnel_trunk_primary', 'bridge_trunk_primary', 'road_trunk_primary'],
//       'line-color',
//       newProps.provincial.lineColor
//     );

//     updateLayerProperties(
//       ['boundary_city'],
//       'line-color',
//       newProps.administrative.lineColor
//     );

//     updateLayerProperties(
//       ['landcover_grass'],
//       'fill-color',
//       newProps.park.fillColor
//     );

//     updateLayerProperties(
//       ['tunnel_trunk_primary', 'bridge_trunk_primary', 'road_trunk_primary'],
//       'line-width',
//       newProps.provincial.lineWidth
//     );

//     updateLayerProperties(
//       ['boundary_city'],
//       'line-dasharray',
//       newProps.administrative.lineDasharray
//     );

//     updateLayerProperties(
//       ['road_label'],
//       'text-color',
//       newProps.roadText.textColor
//     );

//     updateLayerProperties(
//       ['place_city'],
//       'text-color',
//       newProps.adminText.textColor
//     );

//     updateTextSize(
//       ['road_label'],
//       newProps.roadText.textSize
//     );

//     updateTextSize(
//       ['place_city'],
//       newProps.adminText.textSize
//     );

//     // map.value.on('load', () => {
//     //   getInitialPropertys();
//     //   watch(
//     //     () => ({ ...props.layerProperty }),
//     //     (newProps, oldProps) => {
//     //       console.log(newProps)
//     //       const updateLayerProperties = (layers, property, value) => {
//     //         layers.forEach(layerId => {
//     //           if (map.value && map.value.getLayer(layerId)) {
//     //             try {
//     //               map.value.setPaintProperty(layerId, property, value);
//     //             } catch (error) {
//     //               console.warn(`無法設置圖層 ${layerId} 的 ${property} 屬性:`, error);
//     //             }
//     //           }
//     //         });
//     //       };

//     //       const updateTextSize = (layers, size) => {
//     //         layers.forEach(layerId => {
//     //           if (map.value && map.value.getLayer(layerId)) {
//     //             try {
//     //               map.value.setLayoutProperty(layerId, 'text-size', size);
//     //             } catch (error) {
//     //               console.warn(`無法設置圖層 ${layerId} 的文字大小:`, error);
//     //             }
//     //           }
//     //         });
//     //       };

//     //       // 確保 map.value 存在
//     //       if (map.value) {
//     //         updateLayerProperties(
//     //           ['tunnel_trunk_primary', 'bridge_trunk_primary', 'road_trunk_primary'],
//     //           'line-color',
//     //           newProps.provincial.lineColor
//     //         );

//     //         updateLayerProperties(
//     //           ['boundary_city'],
//     //           'line-color',
//     //           newProps.administrative.lineColor
//     //         );

//     //         updateLayerProperties(
//     //           ['landcover_grass'],
//     //           'fill-color',
//     //           newProps.park.fillColor
//     //         );

//     //         updateLayerProperties(
//     //           ['tunnel_trunk_primary', 'bridge_trunk_primary', 'road_trunk_primary'],
//     //           'line-width',
//     //           newProps.provincial.lineWidth
//     //         );

//     //         updateLayerProperties(
//     //           ['boundary_city'],
//     //           'line-dasharray',
//     //           newProps.administrative.lineDasharray
//     //         );

//     //         updateLayerProperties(
//     //           ['road_label'],
//     //           'text-color',
//     //           newProps.roadText.textColor
//     //         );

//     //         updateLayerProperties(
//     //           ['place_city'],
//     //           'text-color',
//     //           newProps.adminText.textColor
//     //         );

//     //         updateTextSize(
//     //           ['road_label'],
//     //           newProps.roadText.textSize
//     //         );

//     //         updateTextSize(
//     //           ['place_city'],
//     //           newProps.adminText.textSize
//     //         );
//     //       }
//     //     },
//     //     { deep: true }
//     //   );
//     // });
//   });

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