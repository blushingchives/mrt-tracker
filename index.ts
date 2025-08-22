import { Stations } from "./src/app/MRT Stations";
const closest = { distance: 9999999999999999999, station: {} };
const coordinates = { lat: 1.432893, long: 103.787384 };
Stations.forEach((station) => {
  // Uses havasine formula to get distance
  const R = 6371; // Radius of the Earth in miles
  const rlat1 = coordinates.lat * (Math.PI / 180); // Convert degrees to radians
  const rlat2 = station.lat * (Math.PI / 180); // Convert degrees to radians
  const difflat = rlat2 - rlat1; // Radian difference (latitudes)
  const difflon = (station.long - coordinates.long) * (Math.PI / 180); // Radian difference (longitudes)

  const distance =
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2)
      )
    );
  if (distance < closest.distance) {
    closest.distance = distance;
    closest.station = station;
  }
});
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    console.log({ lat, long });
  });
} else {
  console.log("No Geolocation");
  /* geolocation IS NOT available */
}
console.log(closest);
