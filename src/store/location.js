import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLocationStore = defineStore('location', () => {
  const location = ref({
    lng: 121,
    lat: 23.5,
    bearing: 0,
    pitch: 0,
    zoom: 7
  });

  const updateLocation = (newLocation) => {
    location.value = newLocation;
  };

  return { location, updateLocation };
});
