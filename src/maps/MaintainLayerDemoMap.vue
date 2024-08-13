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
  selectedLayers: Object,
  layerTransparency: Object,
  isAddNewLayer: Boolean
});
const styles = {
  'CAStyle': import.meta.env.VITE_CAStyle,
  'mapboxStyle': import.meta.env.VITE_mapboxStyle,
  'maptilerStyle': import.meta.env.VITE_maptilerStyle,
  'ncdrStyle': import.meta.env.VITE_ncdrStyle
}
const emit = defineEmits(['update:modelValue']);
const baseUrl = ref('');
const mapContainer = ref(null);
const map = ref(null);
let clickedCircleID = null;
const previousStyle = ref(null);
mapboxgl.accessToken = import.meta.env.VITE_UserAccessToken;
const addedLayerIds = ref({});
const getLocation = () => {
  return {
    ...map.value.getCenter(),
    bearing: map.value.getBearing(),
    pitch: map.value.getPitch(),
    zoom: map.value.getZoom()
  };
};

const updateLocation = () => emit('update:modelValue', getLocation());

const updateLayerVisibility = (layerId, isVisible) => {
  if (map.value.getLayer(layerId)) {
    map.value.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
  }
};

const updateLayerOpacity = (layerId, opacity) => {
  let layer = map.value.getLayer(layerId)
  if (layer) {
    if (layer.type == 'fill') {
      map.value.setPaintProperty(layerId, 'fill-opacity', opacity);
    } else if (layer.type == 'raster') {
      map.value.setPaintProperty(layerId, 'raster-opacity', opacity);
    } else if (layer.type == 'line') {
      map.value.setPaintProperty(layerId, 'line-opacity', opacity);
    } else if (layer.type == 'symbol') {
      map.value.setPaintProperty(layerId, 'text-opacity', opacity);
    } else if (layer.type == 'circle') {
      map.value.setPaintProperty(layerId, 'circle-opacity', opacity);
    }
  }
};

watch(
  () => props.modelValue,
  (next) => {
    if (map.value) {
      const curr = getLocation();
      if (curr.lng !== next.lng || curr.lat !== next.lat)
        map.value.setCenter({ lng: next.lng, lat: next.lat });
      if (curr.pitch !== next.pitch) map.value.setPitch(next.pitch);
      if (curr.bearing !== next.bearing) map.value.setBearing(next.bearing);
      if (curr.zoom !== next.zoom) map.value.setZoom(next.zoom);
    }

  },
  { immediate: true }
);

watch(
  () => props.selectedLayers,
  (newSelectedLayers) => {
    for (let [layerId, isVisible] of Object.entries(newSelectedLayers)) {
      if (layerId == 'earthquake') {
        updateLayerVisibility('cluster-layer', isVisible);
        updateLayerVisibility('unclustered-layer', isVisible);
        updateLayerVisibility('cluster-text-layer', isVisible);
      } else {
        updateLayerVisibility(layerId + '-layer', isVisible);
      }

    }
  },
  { deep: true }
);

watch(
  () => props.layerTransparency,
  (newTransparency) => {
    for (let [layer, opacity] of Object.entries(newTransparency)) {
      if (layer == 'earthquake') {
        updateLayerOpacity('cluster-layer', parseFloat(opacity) / 100.0);
        updateLayerOpacity('unclustered-layer', parseFloat(opacity) / 100.0);
        updateLayerOpacity('cluster-text-layer', parseFloat(opacity) / 100.0);
      } else {
        updateLayerOpacity(layer + '-layer', parseFloat(opacity) / 100.0);
      }
    }
  },
  { deep: true }
);

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

function addAdditionalSourceAndLayer() {
  map.value.on('load', () => {
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
        'fill-opacity': parseFloat(props.layerTransparency.riceCrop) / 100.0
      },
      layout: {
        'visibility': props.selectedLayers.riceCrop ? 'visible' : 'none'
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
        'circle-opacity': parseFloat(props.layerTransparency.earthquake) / 100.0
      },
      layout: {
        'visibility': props.selectedLayers.earthquake ? 'visible' : 'none'
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
        'visibility': props.selectedLayers.earthquake ? 'visible' : 'none',
      },
      paint: {
        'text-opacity': parseFloat(props.layerTransparency.earthquake) / 100.0
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
        'circle-opacity': parseFloat(props.layerTransparency.earthquake) / 100.0,
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'clicked'], false],
          2,
          0
        ],
        'circle-stroke-color': '#000000'
      },
      layout: {
        'visibility': props.selectedLayers.earthquake ? 'visible' : 'none'
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
        'raster-opacity': parseFloat(props.layerTransparency.industrialAreaScope) / 100.0
      },
      layout: {
        'visibility': props.selectedLayers.industrialAreaScope ? 'visible' : 'none'
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
        'fill-opacity': parseFloat(props.layerTransparency.soilLiquefactionPotential) / 100.0
      },
      layout: {
        'visibility': props.selectedLayers.countyCityBoundariesGeoJSON ? 'visible' : 'none'
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
        'line-opacity': parseFloat(props.layerTransparency.countyCityBoundariesGeoJSON) / 100.0
      },
      layout: {
        'visibility': props.selectedLayers.countyCityBoundariesGeoJSON ? 'visible' : 'none'
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
        'visibility': props.selectedLayers.countyCityBoundariesSymbol ? 'visible' : 'none'
      },
      paint: {
        'text-color': '#4E4E4E',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1.33333,
        'text-opacity': parseFloat(props.layerTransparency.countyCityBoundariesSymbol) / 100.0
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
    "sprite": `${baseUrl.value}/merged_image`,
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

  map.value.on('move', updateLocation);
  map.value.on('zoom', updateLocation);
  map.value.on('rotate', updateLocation);
  map.value.on('pitch', updateLocation);

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
      map.value.on('load', () => {
        map.value.addLayer({
          id: 'blank-layer',
          type: 'background',
          paint: {
            'background-color': 'rgba(255, 255, 255, 0)'
          }
        });
      });
      addAdditionalSourceAndLayer()

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