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

const layerTypes = ['line'];
const roadTypes = ['primary', 'motorway', 'secondary'];
const mapContainer = ref(null);
const map = ref(null);
let clickedCircleID = null;
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;
// 動態生成 Layers 
// const Layers = {
//   CAStyle: {
//     line: {
//       primary: [
//       ],
//       motorway: [
//       ]
//     }
//   },
//   mapboxStyle: {
//     line: {
//       primary: [
//       ],
//       motorway: [
//       ]
//     }
//   }
// };
const Layers = Object.keys(styles).reduce((acc, styleName) => {
  acc[styleName] = layerTypes.reduce((layerAcc, layerType) => {
    layerAcc[layerType] = roadTypes.reduce((roadAcc, roadType) => {
      roadAcc[roadType] = [];
      return roadAcc;
    }, {});
    return layerAcc;
  }, {});
  return acc;
}, {});

// 處理地圖樣式數據
// 填入對應的layerid
// const Layers = {
//   CAStyle: {
//     line: {
//       primary: [
//         'tunnel_trunk_primary_casing',
//         'tunnel_trunk_primary',
//         'bridge_trunk_primary',
//         'road_trunk_primary',
//         'road_trunk_primary_casing',
//         'bridge_trunk_primary_casing'
//       ],
//       motorway: [
//         "tunnel_motorway_link_casing",
//         "tunnel_motorway_casing",
//         "tunnel_motorway_link",
//         "tunnel_motorway",
//         "road_motorway_link_casing",
//         "road_motorway_casing",
//         "road_motorway_link",
//         "road_motorway",
//         "bridge_motorway_link_casing",
//         "bridge_motorway_casing",
//         "bridge_motorway_link",
//         "bridge_motorway",
//       ]
//     }
//   }

// };

const processMapStyle = (mapStyle, styleName) => {
  layerTypes.forEach(layerType => {
    roadTypes.forEach(roadType => {
      if (Layers[styleName] && Layers[styleName][layerType]) {
        Layers[styleName][layerType][roadType] = mapStyle.layers
          .filter(layer => layer.type === layerType && layer.id.includes(roadType))
          .map(layer => layer.id);
      }
    });
  });
  console.log(Layers);
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

    if (props.mapStyle && Layers[props.mapStyle]) {
      Object.entries(newColor).forEach(([key, color]) => {
        if (!oldColor || color !== oldColor[key]) {
          console.log(`Layer color changed: ${key}, New value: ${color}, Old value: ${oldColor?.[key]}`);

          const layerGroup = Layers[props.mapStyle]['line'][key];
          if (layerGroup) {
            layerGroup.forEach(layer => {
              map.value.setPaintProperty(layer, 'line-color', color);
            });
          }
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

    if (props.mapStyle && Layers[props.mapStyle]) {
      Object.entries(newOpacity).forEach(([key, opacity]) => {
        if (!oldOpacity || opacity !== oldOpacity[key]) {
          console.log(`Layer opacity changed: ${key}, New value: ${opacity}, Old value: ${oldOpacity?.[key]}`);

          const layerGroup = Layers[props.mapStyle]['line'][key];
          if (layerGroup) {
            layerGroup.forEach(layer => {
              map.value.setPaintProperty(layer, 'line-opacity', calculateNormalizedOpacity(opacity));
            });
          }
        }
      });
    }
  },
  { deep: true }
);

function addAdditionalSourceAndLayer() {
  map.value.on('style.load', () => {
    map.value.addSource('riceCrop', {
      type: 'vector',
      tiles: [
        'https://cb-vm-portal.richitech.com/arcgis/rest/services/Hosted/Rice1/VectorTileServer/tile/{z}/{y}/{x}.pbf'
      ],
      minzoom: 6,
      maxzoom: 14
    });

    map.value.addLayer({
      id: 'riceCrop-layer',
      type: 'fill',
      source: 'riceCrop',
      'source-layer': 'Rice',
      paint: {
        'fill-color': '#ffd338',
      },
      layout: {
      }
    });

    map.value.addSource('earthquakes', {
      type: 'geojson',
      data: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
      generateId: true
    });

    map.value.addLayer({
      id: 'cluster-layer',
      type: 'circle',
      source: 'earthquakes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          10,
          '#f1f075',
          20,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, 10,
          30, 20,
          40
        ],
      },
      layout: {
      }
    });

    map.value.addLayer({
      id: 'cluster-text-layer',
      type: 'symbol',
      source: 'earthquakes',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
      },
    });

    map.value.addLayer({
      id: 'unclustered-layer',
      type: 'circle',
      source: 'earthquakes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'step',
          ['get', 'mag'],
          '#00ff00', 3,
          '#ffff00', 7,
          '#ff0000'
        ],
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'clicked'], false],
          2,
          0
        ],
        'circle-stroke-color': '#000000'
      },
      layout: {
      }
    });

    map.value.on('click', 'cluster-layer', (e) => {
      const features = map.value.queryRenderedFeatures(e.point, {
        layers: ['cluster-layer']
      });
      const clusterId = features[0].properties.cluster_id;
      map.value
        .getSource('earthquakes')
        .getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
    });

    map.value.on('click', 'unclustered-layer', (e) => {
      if (e.features.length > 0) {
        if (clickedCircleID !== null) {
          map.value.setFeatureState(
            { source: 'earthquakes', id: clickedCircleID },
            { clicked: false }
          );
        }
        clickedCircleID = e.features[0].id;
        map.value.setFeatureState(
          { source: 'earthquakes', id: clickedCircleID },
          { clicked: true }
        );
      }


      map.value.easeTo({
        center: e.lngLat,
      });

      const feature = e.features[0];
      const magnitude = feature.properties.mag;
      const time = new Date(feature.properties.time).toUTCString();
      const place = feature.properties.place;

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div>震度：${magnitude}</div>
          <div>時間：${time}</div>
          <div>地點：${place}</div>
        `)
        .addTo(map.value);
    });
    map.value.addSource('industrialAreaScope', {
      type: "raster",
      tiles: [
        "https://richimap1.richitech.com.tw/arcgis/services/CBB_Practice/CBB_Practice_Industry_84/MapServer/WMSServer?service=WMS&request=GetMap&version=1.3.0&layers=0&styles=&format=image/png&transparent=true&height=256&width=256&crs=EPSG:3857&bbox={bbox-epsg-3857}"
      ],
      tileSize: 256
    });

    map.value.addLayer({
      id: "industrialAreaScope-layer",
      type: "raster",
      source: 'industrialAreaScope',
      paint: {
      },
      layout: {
      }
    }, 'riceCrop-layer');

    map.value.addSource('soilLiquefactionPotential', {
      type: 'geojson',
      data: 'soilLiquefactionPotential.geojson'
    });

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
        'fill-opacity': 0.5
      },
      layout: {
      }
    });

    map.value.addSource('countyCityBoundariesGeoJSON', {
      type: 'geojson',
      data: 'https://ncdr3d.richitech.com.tw/Files/disp/AdministrativeDistrict/MOI_W84_COUNTY_SIMPLIFY.geojson'
    });

    map.value.addLayer({
      id: 'countyCityBoundariesGeoJSON-layer',
      type: 'line',
      source: 'countyCityBoundariesGeoJSON',
      paint: {
        'line-width': 1.3333,
        'line-color': '#ffffff',
      },
      layout: {
      }
    });

    map.value.addSource('countyCityBoundariesSymbol', {
      type: 'geojson',
      data: 'https://ncdr3d.richitech.com.tw/Files/disp/AdministrativeDistrict/MOI_W84_COUNTY_Point.geojson'
    });

    map.value.addLayer({
      id: 'countyCityBoundariesSymbol-layer',
      type: 'symbol',
      source: 'countyCityBoundariesSymbol',
      layout: {
        'text-field': [
          'format',
          ['get', 'COUNTYNAME'],
          { 'font-scale': 1 }
        ],
        'text-font': ['Open Sans Semibold'],
      },
      paint: {
        'text-color': '#4E4E4E',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1.33333,
      }
    });
  });

  map.value.on('mouseenter', ['cluster-layer', 'unclustered-layer'], () => {
    map.value.getCanvas().style.cursor = 'pointer';
  });
  map.value.on('mouseleave', ['cluster-layer', 'unclustered-layer'], () => {
    map.value.getCanvas().style.cursor = '';
  });
  map.value.on('click', function (e) {
    var features = map.value.queryRenderedFeatures(e.point, { layers: ['unclustered-layer'] });
    if (!features.length) {
      resetClickedState();
    }
  });
}
function resetClickedState() {
  var features = map.value.querySourceFeatures('earthquakes');
  features.forEach(function (feature) {
    map.value.setFeatureState(
      { source: 'earthquakes', id: feature.id },
      { clicked: false }
    );
  });
}

const getInitialColors = () => {
  if (!map.value) return;

  const initialColors = {};
  roadTypes.forEach(roadType => {
    if (Layers[props.mapStyle] && Layers[props.mapStyle].line && Layers[props.mapStyle].line[roadType]) {
      const layerId = Layers[props.mapStyle].line[roadType][1];
      if (layerId) {
        console.log(map.value)
        console.log(layerId)
        const color = map.value.getPaintProperty(layerId, 'line-color');
        console.log(color)
        initialColors[roadType] = color;
      }
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
    addAdditionalSourceAndLayer();
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