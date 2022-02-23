
const OVERPASSURL = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter?';
const GEOAPIURL = 'https://geo.api.gouv.fr/communes'
const GEOAPIOPTIONS = '&fields=code,nom,codesPostaux,contour'


/**
 * Recherche les elements de type amenityType dans la ville cityGeoJson
 * @param  {[type]} cityGeoJson [description]
 * @param  {[type]} amenityType [description]
 * @return {[type]}         [description]
 */
 async function getAmenityByOverPass(codeInsee, amenityType) {

  let elemnList = '';
  // access to all nodes and the center of way.
  elemDescr[amenityType]["code"].forEach(elem => elemnList+= '[' + elem + ']');
  const overpassAmenityList = `node${elemnList}["access"!~"private"](area.zip);way${elemnList}["access"!~"private"](area.zip);`;

  const area = `area["ref:INSEE"=${codeInsee}][boundary=administrative]->.zip`
  const overpassApiUrl = `${OVERPASSURL}data=[out:json];${area};(${overpassAmenityList});out center;`;

  const responseOverpass = await fetch(overpassApiUrl);
  const osmDataAsJson = await responseOverpass.json(); // read response body and parse as JSON

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
  
    const geoApiUrl = `${GEOAPIURL}?lat=${lat}&lon=${lon}${GEOAPIOPTIONS}`;
    const response = await fetch(geoApiUrl);
    const responsejson = await response.json(); // read response body and parse as JSON
    
    return await responsejson[0]
    }
  