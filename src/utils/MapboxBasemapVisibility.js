import mapboxgl from 'mapbox-gl';
import axios from 'axios';

export default class MapboxBasemapVisibility {
  constructor({
    styles,
    customAccessToken = null,
    customGlyphsUrl = null,
    customSpriteUrl = null,
    customBlankStyle = null
  }) {
    this._mapboxgl = mapboxgl;
    this._axios = axios;
    this._styles = styles;
    this._mapboxgl.accessToken = customAccessToken || import.meta.env.VITE_UserAccessToken;
    this._glyphsUrl = customGlyphsUrl || "mapbox://fonts/mapbox/{fontstack}/{range}.pbf";
    this._customBlankStyle = customBlankStyle;
    this._addedLayerIds = {};
    this._spriteUrl = customSpriteUrl || "https://nlscvt.richitech.com.tw/fileServer/mapbox/merged_sprite";
  }

  get addedLayerIds() {
    return this._addedLayerIds;
  }

  get styles() {
    return this._styles;
  }

  set styles(newStyles) {
    this._styles = newStyles;
  }

  async createMap({
    container,
    options,
    defaultStyle,
  }) {
    const blankStyle = this._createBlankStyle();
    const mapboxMap = new this._mapboxgl.Map({
      container,
      style: blankStyle,
      ...options
    });
    
    mapboxMap.addControl(new this._mapboxgl.NavigationControl());

    await new Promise(resolve => mapboxMap.on('load', resolve));
    this._addBaseMapBlankLayer(mapboxMap);
    this._loadBaseMapLayersVisible(mapboxMap, defaultStyle);
    
    const proxyMap = new Proxy(mapboxMap, {
      get: (target, prop) => {
        if (prop in this) {
          return (...args) => this[prop](target, ...args);
        }
        return target[prop];
      }
    });

    return proxyMap;
  }

  async loadBaseMapLayers(map, styleName) {
    if (!this._addedLayerIds[styleName]) {
      this._addedLayerIds[styleName] = [];
    }
    const mapStyle = await this._fetchStyle(styleName);
    this._addSourcesAndLayers(map, mapStyle, styleName);
  }

  async _loadBaseMapLayersVisible(map, defaultStyle) {
    for (const styleName of Object.keys(this._styles)) {
      await this.loadBaseMapLayers(map, styleName);
      if (styleName !== defaultStyle) {
        this._addedLayerIds[styleName].forEach(layerId => {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        });
      }
    }
  }

  async changeBaseMap(map, newStyle) {
    if (!this._addedLayerIds[newStyle]) {
      this._addedLayerIds[newStyle] = [];
    }
    this._toggleBaseMapVisibility(map, newStyle);
  }

  _toggleBaseMapVisibility(map, activeStyle) {
    Object.keys(this._addedLayerIds).forEach(styleName => {
      const isVisible = styleName === activeStyle;
      this._addedLayerIds[styleName].forEach(layerId => {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      });
    });
  }

  _createBlankStyle() {
    const defaultBlankStyle = {
      version: 8,
      name: 'BlankMap',
      sources: {},
      layers: [],
      glyphs: this._glyphsUrl,
      sprite: this._spriteUrl,
    };

    if (this._customBlankStyle) {
      return {
        ...defaultBlankStyle,
        ...this._customBlankStyle
      };
    } else {
      return defaultBlankStyle;
    }
  }

  async _fetchStyle(styleName) {
    const urls = Array.isArray(this._styles[styleName]) ? this._styles[styleName] : [this._styles[styleName]];
    const styleData = await Promise.all(urls.map(async (url) => {
      const response = await this._axios.get(url);
      return response.data;
    }));

    return this._mergeStyles(styleData);
  }

  _mergeStyles(styleData) {

    let mergedStyle = { ...styleData[0] };
    for (let i = 1; i < styleData.length; i++) {
      mergedStyle.layers = [...mergedStyle.layers, ...styleData[i].layers];
      mergedStyle.sources = { ...mergedStyle.sources, ...styleData[i].sources };
    }
    return mergedStyle;
  }

  _ensureMapLoaded(map) {
    return new Promise(resolve => {
      if (map.loaded()) {
        resolve();
      } else {
        map.on('load', resolve);
      }
    });
  }

  _addSourcesAndLayers(map, mapStyle, styleName) {
    this._addSources(map, mapStyle.sources);
    this._addLayers(map, mapStyle.layers, styleName);
    
  }

  _addSources(map, sources) {
    Object.entries(sources).forEach(([sourceName, sourceData]) => {
      if (!map.getSource(sourceName)) {
        map.addSource(sourceName, sourceData);
      }
    });
  }

  _addLayers(map, layers, styleName) {
    layers.forEach(layer => {
      let newLayerId = `${styleName}-${layer.id}`;
      
      if (!map.getLayer(newLayerId)) {
        try {
          const layerToAdd = { ...layer, id: newLayerId };
          map.addLayer(layerToAdd,'base-map');
          this._addedLayerIds[styleName].push(newLayerId);
        } catch (error) {
          console.warn(`Failed to add layer ${newLayerId}:`, error);
        }
      }
    });
  }

  _addBaseMapBlankLayer(map) {
    if (!map.getLayer('base-map')) {
      map.addLayer({
        id: 'base-map',
        type: 'background',
        paint: {
          'background-color': 'rgba(255, 255, 255, 0)'
        }
      });
    }
  }

  _removeAddedLayers(map, styleName) {
    this._addedLayerIds[styleName].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    this._addedLayerIds[styleName] = [];
  }

}