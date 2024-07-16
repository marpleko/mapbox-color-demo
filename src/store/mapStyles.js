import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMapStylesStore = defineStore('mapStyles', () => {
    const styles = {
        'CAStyle': import.meta.env.VITE_CAStyle,
        'mapboxStyle': import.meta.env.VITE_mapboxStyle,
        'maptilerStyle': import.meta.env.VITE_maptilerStyle,
        'ncdrStyle': import.meta.env.VITE_ncdrStyle
      }
  return { styles };
});