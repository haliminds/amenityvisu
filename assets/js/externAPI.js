
const OVERPASSURL = 'https://lz4.overpass-api.de/api/interpreter?';
const NOMINATIM = 'https://nominatim.openstreetmap.org/';
const NOMINATIMREVERSEURL = NOMINATIM + 'reverse?'
const NOMINATIMSEARCHURL = NOMINATIM + 'search.php?'

/**
 * Recherche les elements de type amenityType dans la ville cityGeoJson
 * @param  {[type]} cityGeoJson [description]
 * @param  {[type]} amenityType [description]
 * @return {[type]}         [description]
 */
async function getAmenityByOverPass(cityGeoJson, amenityType) {

  // Recherche des elements dans cette zone
  // 3600000000 : on ajoute pour avoir la "relation" correpondante
  const area_id = 3600000000 + parseInt(cityGeoJson.features[0].properties.osm_id, 10);
  let overpassAmenityList = '';
  let elemnList = '';
  // access to all nodes and the center of way.
  elemDescr[amenityType]["code"].forEach(elem => elemnList+= '[' + elem + ']');
  overpassAmenityList += 'node' + elemnList + '["access"!~"private"](area.searchArea);way' + elemnList + '["access"!~"private"](area.searchArea);'

  const overpassApiUrl = OVERPASSURL + 'data=[out:json];area(' + area_id + ')->.searchArea;(' + overpassAmenityList + ');out center;';
  let responseOverpass = await fetch(overpassApiUrl);
  let osmDataAsJson = await responseOverpass.json(); // read response body and parse as JSON

  // tranformation de la reponse en geojson
  return await osmtogeojson(osmDataAsJson);
}


/**
 * Get a city name from a latitude and a longitude
 * @param  {float} lat input latitude
 * @param  {float} lon input longitude
 * @return {[type]} json response of nominatim api
 */
async function getCityByLatLng(lat, lon) {
  // appelle Nominatim reverse pour savoir dans quelle commune on se trouve
  const nominatiUrl = NOMINATIMREVERSEURL + 'lat=' + lat + '&lon=' + lon + '&polygon_geojson=1&format=geojson&zoom=10';
  console.log(nominatiUrl)
  let nominatimResp = await fetch(nominatiUrl);
  let nominatimGeoJson = await nominatimResp.json(); // read response body and parse as JSON
  // recuperation de la commune
  let cityname = nominatimGeoJson.features[0].properties.address.city || nominatimGeoJson.features[0].properties.address.municipality;
  // si ça pointe n'import où, ben tant pis !
  if (cityname == undefined) {
    return null;
  }
  // appelle nominatim pour avoir le geojson à partir de la ville (pb avec le reverse)
  const urlCity = NOMINATIMSEARCHURL + 'city=' + cityname + '&polygon_geojson=1&format=geojson&addressdetails=1';
  let response_city = await fetch(urlCity);
  nominatimGeoJson = await response_city.json();

  return await nominatimGeoJson;
}
