import mapboxgl from 'mapbox-gl';
import axios from 'axios';

export default class MapStyleFactory {
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
    this._previousStyle = null;
    this._allStylesLoaded = false;
    this._originalOpacities = {};
    this._originalSetPaintProperty = null;
    this._switchMode = null;
  }

  get addedLayerIds() {
    return this._addedLayerIds;
  }

  get previousStyle() {
    return this._previousStyle;
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
    switchMode = 'remove'
  }) {
    this.setSwitchMode(switchMode); 
    this._previousStyle = defaultStyle;
    const blankStyle = this._createBlankStyle();
    const mapboxMap = new this._mapboxgl.Map({
      container,
      style: blankStyle,
      ...options
    });
    
    mapboxMap.addControl(new this._mapboxgl.NavigationControl());

    await new Promise(resolve => mapboxMap.on('load', resolve));
    this._addBaseMapBlankLayer(mapboxMap);
    switch (this._switchMode) {
      case 'remove':
        await this.loadBaseMapLayers(mapboxMap, defaultStyle);
        break;
      case 'visible':
        await this._loadBaseMapLayersVisible(mapboxMap, defaultStyle);
        break;
      case 'opacity':
        await this._loadBaseMapLayersOpacity(mapboxMap, defaultStyle);
        break;
    }
    
    const proxyMap = new Proxy(mapboxMap, {
      get: (target, prop) => {
        if (prop === 'setPaintProperty') {
          return this._interceptSetPaintProperty(target);
        }
        if (prop in this) {
          return (...args) => this[prop](target, ...args);
        }
        return target[prop];
      }
    });

    this._originalSetPaintProperty = mapboxMap.setPaintProperty.bind(mapboxMap);

    return proxyMap;
  }

  async loadBaseMapLayers(map, styleName) {
    if (!this._addedLayerIds[styleName]) {
      this._addedLayerIds[styleName] = [];
    }
    const mapStyle = await this._fetchStyle(styleName);
    this._addSourcesAndLayers(map, mapStyle, styleName);
    //await this._ensureMapLoaded(map);
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

  async _loadBaseMapLayersOpacity(map, defaultStyle) {
    for (const styleName of Object.keys(this._styles)) {
      await this.loadBaseMapLayers(map, styleName);
      this._originalOpacities[styleName] = {};
      if (styleName !== defaultStyle) {
        this._addedLayerIds[styleName].forEach(layerId => {
          const layer = map.getLayer(layerId);
          if (layer) {
            this._originalOpacities[styleName][layerId] = this._getLayerOpacity(map, layerId);
            this._setLayerOpacity(map, layerId, 0);
          }
        });
      }
    }
  }

  _getLayerOpacity(map, layerId) {
    const layer = map.getLayer(layerId);
    if (layer) {
      switch (layer.type) {
        case 'background':
          return map.getPaintProperty(layerId, 'background-opacity');
        case 'fill':
          return map.getPaintProperty(layerId, 'fill-opacity');
        case 'line':
          return map.getPaintProperty(layerId, 'line-opacity');
        case 'symbol':
          return map.getPaintProperty(layerId, 'icon-opacity') || map.getPaintProperty(layerId, 'text-opacity');
        case 'raster':
          return map.getPaintProperty(layerId, 'raster-opacity');
        case 'circle':
          return map.getPaintProperty(layerId, 'circle-opacity');
        case 'fill-extrusion':
          return map.getPaintProperty(layerId, 'fill-extrusion-opacity');
        case 'heatmap':
          return map.getPaintProperty(layerId, 'heatmap-opacity');
        case 'hillshade':
          return map.getPaintProperty(layerId, 'hillshade-exaggeration');
        default:
          return 1;
      }
    }
    return 1;
  }

  _setLayerOpacity(map, layerId, opacity) {
    const layer = map.getLayer(layerId);
    if (layer) {
      switch (layer.type) {
        case 'background':
          map.setPaintProperty(layerId, 'background-opacity', opacity);
          break;
        case 'fill':
          map.setPaintProperty(layerId, 'fill-opacity', opacity);
          break;
        case 'line':
          map.setPaintProperty(layerId, 'line-opacity', opacity);
          break;
        case 'symbol':
          map.setPaintProperty(layerId, 'icon-opacity', opacity);
          map.setPaintProperty(layerId, 'text-opacity', opacity);
          break;
        case 'raster':
          map.setPaintProperty(layerId, 'raster-opacity', opacity);
          break;
        case 'circle':
          map.setPaintProperty(layerId, 'circle-opacity', opacity);
          break;
        case 'fill-extrusion':
          map.setPaintProperty(layerId, 'fill-extrusion-opacity', opacity);
          break;
        case 'heatmap':
          map.setPaintProperty(layerId, 'heatmap-opacity', opacity);
          break;
        case 'hillshade':
          map.setPaintProperty(layerId, 'hillshade-exaggeration', opacity);
          break;
      }
    }
  }

  async changeBaseMap(map, newStyle) {
    if (!this._addedLayerIds[newStyle]) {
      this._addedLayerIds[newStyle] = [];
    }

    await this._switchBaseMapMode(map, newStyle);
    this._previousStyle = newStyle;
  }

  async _switchBaseMapMode(map, newStyle) {
    switch (this._switchMode) {
      case 'remove':
        await this._toggleBaseMapRemove(map, newStyle);
        break;
      case 'visible':
        this._toggleBaseMapVisibility(map, newStyle);
        break;
      case 'opacity':
        this._toggleBaseMapOpacity(map, newStyle);
        break;
      default:
        throw new Error('Invalid switch mode');
    }
  }

  async _toggleBaseMapRemove(map, newStyle) {
    if (this._previousStyle && this._addedLayerIds[this._previousStyle]) {
      this._removeAddedLayers(map, this._previousStyle);
    }
    await this.loadBaseMapLayers(map, newStyle);
  }

  // async _loadAllStyles(map) {
  //   for (const styleName of Object.keys(this._styles)) {
  //     if (!this._addedLayerIds[styleName]) {
  //       await this.loadLayers(map, styleName);
  //     }
  //   }
  //   this._allStylesLoaded = true;
  // }

  _toggleBaseMapVisibility(map, activeStyle) {
    Object.keys(this._addedLayerIds).forEach(styleName => {
      const isVisible = styleName === activeStyle;
      this._addedLayerIds[styleName].forEach(layerId => {
        map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
      });
    });
  }

  _toggleBaseMapOpacity(map, activeStyle) {
    console.log('toggleBaseMapOpacity', this._originalOpacities);
    Object.keys(this._addedLayerIds).forEach(styleName => {
      const isActive = styleName === activeStyle;
      this._addedLayerIds[styleName].forEach(layerId => {
        const layer = map.getLayer(layerId);
        if (layer) {
          const opacity = isActive ? this._originalOpacities[styleName][layerId] : 0;
          this._setLayerOpacity(map, layerId, opacity);
        }
      });
    });
  }

  setSwitchMode(mode) {
    if (['remove', 'visible', 'opacity'].includes(mode)) {
      this._switchMode = mode;
    } else {
      throw new Error('Invalid switch mode');
    }
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

  _interceptSetPaintProperty(map) {
    return (layerId, name, value) => {
      this._originalSetPaintProperty(layerId, name, value);

      if (this._switchMode === 'opacity' && this._isOpacityProperty(name)) {
        this._recordOpacityChange(layerId, name, value);
      }
    };
  }

  _isOpacityProperty(name) {
    return name.toLowerCase().includes('opacity');
  }

  _recordOpacityChange(layerId, name, value) {
    const styleName = this._getStyleNameFromLayerId(layerId);
    if (styleName) {
      if (!this._originalOpacities[styleName]) {
        this._originalOpacities[styleName] = {};
      }
      if (!this._originalOpacities[styleName][layerId]) {
        this._originalOpacities[styleName][layerId] = {};
      }
      this._originalOpacities[styleName][layerId] = value;
      console.log(`Recorded opacity change for layer ${layerId}, ${name}: ${value}`);
    }
  }

  _getStyleNameFromLayerId(layerId) {
    for (const [styleName, layerIds] of Object.entries(this._addedLayerIds)) {
      if (layerIds.includes(layerId)) {
        return styleName;
      }
    }
    return null;
  }
}