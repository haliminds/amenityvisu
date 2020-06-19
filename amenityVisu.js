/**
 *
 *
 */

var map = "";
var cityGeoJson = "";

/**
 * [initialize description]
 * @return {[type]} [description]
 */
function initialize() {
  createSideBar();
  // before showing the map, show a gif
  fillMapInnerHTML("<img src=\"loader.gif\" />");

  if (navigator.geolocation) {
    let location_timeout = setTimeout("fillMapInnerHTML('<br><br>GPS non activé !')", 5000);
    let geoOptions = {
      enableHighAccuracy: false,
      maximumAge: 10000,
      timeout: 5000
    };

    navigator.geolocation.getCurrentPosition(function(position) {
      clearTimeout(location_timeout);

      let lat_pos = position.coords.latitude;
      let lon_pos = position.coords.longitude;

      showDataVoronoi(lat_pos, lon_pos);

    }, function(error) {
      clearTimeout(location_timeout);
      fillMapInnerHTML('<br><br>GPS non activé !');
    }, geoOptions);
  } else {
    // Fallback for no geolocation
    fillMapInnerHTML('<br><br>GPS non activé !');
  }
}

/**
 * [fillMapInnerHTML description]
 * @param  {[type]} htmlString [description]
 */
function fillMapInnerHTML(htmlString) {
  document.getElementById('map').innerHTML = htmlString;
}

/**
 * Compute the area (in km²) of the input polygon
 * @param  {Array} polygon [description]
 * @return {[type]}         [description]
 */
function computePolygonArea(polygon) {
  let Ldeg = 40075 / 360;
  let centroid = d3.polygonCentroid(polygon);
  return Math.abs(Ldeg * Ldeg * Math.cos(centroid[1] * Math.PI / 180) * d3.polygonArea(polygon));
}


/**
 * Get a city name from a latitude and a longitude
 * @param  {float} lat input latitude
 * @param  {float} lon input longitude
 * @return {[type]} json response of nominatim api
 */
async function getCityByLatLng(lat, lon) {
  // appelle Nominatim pour savoir dans quelle commune on se trouve
  // On fait un 1er appel à du reverse et/ou un appel normal pour avoir l'osm_id et le geojson si le premier appel merde
  const nominatiUrl = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&polygon_geojson=1&format=geojson&zoom=10';
  let nominatimResp = await fetch(nominatiUrl);
  let nominatimGeoJson = await nominatimResp.json(); // read response body and parse as JSON
  // Si ça pointe sur un ensemble de type Point, y'a un souci
  // @TODO regarder si il faut d'autres verifs !!
  let cityname = nominatimGeoJson.features[0].properties.address.city || nominatimGeoJson.features[0].properties.address.municipality;
  // si ça pointe n'import où, ben tant pis !
  if (cityname == undefined) {
    return null;
  }
  // sinon, on cherche les infos sur la ville pointee
  if (nominatimGeoJson.features[0].geometry.type == "Point") {
    const urlCity = 'https://nominatim.openstreetmap.org/search.php?city=' + cityname + '&polygon_geojson=1&format=geojson&addressdetails=1';
    let response_city = await fetch(urlCity);
    nominatimGeoJson = await response_city.json();
  }

  return nominatimGeoJson;
}


/**
 * [computeVoronoi description]
 * @param  {[type]} amenity [description]
 * @return {[type]}         [description]
 */
async function computeVoronoi(amenity) {
  // clean all markers

  let div_nbPOI = document.getElementById('nbPOI');
  div_nbPOI.innerHTML = "Calcul en cours";

  await removeMarkers(map, "voronoi");

  // Recherche des elemnts dans cette zone
  // 3600000000 : on ajoute pour avoir la "relation" correpondante
  const area_id = 3600000000 + parseInt(cityGeoJson.features[0].properties.osm_id, 10);
  let overpassAmenityList = '';
  elemDescr[amenity]["code"].forEach(elem => overpassAmenityList += 'node['+elem+'](area.searchArea);');
  const overpassApiUrl = 'https://lz4.overpass-api.de/api/interpreter?data=[out:json];area(' + area_id + ')->.searchArea;'+overpassAmenityList+'out;';
  let responseOverpass = await fetch(overpassApiUrl);
  let osmDataAsJson = await responseOverpass.json(); // read response body and parse as JSON

  // tranformation de la reponse en geojson
  let elementData = osmtogeojson(osmDataAsJson);

  // chargement des points et transformation du tableau en objet
  var points = [];
  elementData.features.forEach(elem => points.push(elem.geometry.coordinates));

  // Update command
  const elemNbTxt = ((points.length > 1) ? " éléments référencés)" : " élément référencé)");
  div_nbPOI.innerHTML = "(" + points.length + elemNbTxt;

  let city = L.geoJson(cityGeoJson.features[0]);
  // Comme toujours avec D3JS lorsqu'un type de graphique a été intégré, il est très
  // facile à mettre en oeuvre. la fonction voronoi appliquée sur la liste des points
  // filtrés ajoutent pour chacun d'eux le polygone que l'on va représenter.
  // on restreint les polygones sur la frontire francaise

  // without margin, some points may be on city frontier and create an error for intersect algorithm
  let margin = 1e-3;
  let boundd3js = [
    [city.getBounds()._southWest.lng - margin, city.getBounds()._southWest.lat - margin],
    [city.getBounds()._northEast.lng + margin, city.getBounds()._northEast.lat + margin]
  ];
  let voronoi = d3.voronoi().extent(boundd3js); // limite commune
  // on cree le diagramme de voronoi a partir des data
  let voronoiPolygons = voronoi.polygons(points);

  // pour chaque polygone, on cree un geojson qu'on intégre dans la carte
  //var t0 = performance.now()
  for (let zone of voronoiPolygons) {
    if (zone == undefined) {
      continue;
    }
    // on cree des vrais polygones avec le premier et dernier elements egaux
    zone.push(zone[0]);

    // on verifie pour chaque zone si tous les points sont dans la ville
    let intersect_arr = [];

    let isZoneInsideCity = true;
    for (let cityPart of cityGeoJson.features[0].geometry.coordinates) {
      isZoneInsideCity = true;
      for (let point of zone) {
        if (!d3.polygonContains(cityPart, point)) {
          isZoneInsideCity = false;
          break
        }
      }
    }

    // on calcule l'intersection de la zone avec celle de la commune entière quand un des points de la zone est en dehors de la ville
    intersect_arr = ((isZoneInsideCity) ? [
      [zone]
    ] : martinez.intersection(cityGeoJson.features[0].geometry.coordinates, [zone]));

    for (let intersect_part of intersect_arr) {
      // si l'element est dans la zone, on calcule son aire sinon, on met cette aire au max.
      let area = ((d3.polygonContains(intersect_part[0], zone.data)) ? computePolygonArea(intersect_part[0]) * 1000 * 1000 : 1e7);
      let interseect_zone = {
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": []
          },
          "properties": 0
        }]
      };

      interseect_zone.features[0].properties = {
        "area": area,
        "amenity_coord": zone.data
      };
      interseect_zone.features[0].geometry.coordinates = intersect_part;
      L.geoJson(interseect_zone, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);
    }
  };

  //var t1 = performance.now()
  //console.log("Call to compute polygon " + (t1 - t0) + " milliseconds.")
}

/**
 * [onEachFeature description]
 * @param  {[type]} feature [description]
 * @param  {[type]} layer   [description]
 * @return {[type]}         [description]
 */
function onEachFeature(feature, layer) {
  layer.myTag = "voronoi";
  layer.on({
    mouseover: highlightLocalAmenity,
    mouseout: resetLocalAmenity
  });
}

/**
 * [highlightLocalAmenity description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
function highlightLocalAmenity(e) {
  let layer = e.target;
  let geojsonMarkerOptions = {
    radius: 4,
    fillColor: "#ff0000",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
  };
  let amenity_point = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": layer.feature.properties.amenity_coord
    }
  };
  L.geoJson(amenity_point, {
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    onEachFeature: function(feature, layer) {
      layer.myTag = "amenity_pt";
    }
  }).addTo(map);
}


/**
 * [resetLocalAmenity description]
 * @param {[type]} e [description]
 */
async function resetLocalAmenity(e) {
  await removeMarkers(map, "amenity_pt");
}


/**
 * [style description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
function style(feature) {
  return {
    fillColor: getColor(feature.properties.area),
    weight: 1,
    opacity: 1,
    color: 'black',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

/**
 * [getColor description]
 * @param  {[type]} d [description]
 * @return {[type]}   [description]
 */
function getColor(d) {
  return d > 100000 ? '#FFEDA0' :
    d > 40000 ? '#FED976' :
    d > 20000 ? '#FEB24C' :
    d > 8000 ? '#FD8D3C' :
    d > 4000 ? '#FC4E2A' :
    d > 2000 ? '#E31A1C' :
    d > 1000 ? '#BD0026' :
    '#800026';
};

/**
 * [removeMarkers description]
 * @param  {[type]} map [description]
 * @param  {[type]} tag [description]
 * @return {[type]}     [description]
 */
async function removeMarkers(map, tag) {
  map.eachLayer(function(layer) {

    if (layer.myTag && layer.myTag === tag) {
      map.removeLayer(layer);
    }
  });
};

/**
 * [simplifyCity description]
 * @return {[type]} [description]
 */
async function simplifyCity() {
  // simplify current geometry of city to speed up
  // If many polygons, simplify each polygon and re-fill the citygeoJson
  let optionSimplify = {
    tolerance: 0.00005,
    highQuality: false
  }
  if (cityGeoJson.features[0].geometry.coordinates.length > 1) {
    let city_part_id = 0
    for (let coord of cityGeoJson.features[0].geometry.coordinates) {
      let simplified = turf.simplify(turf.polygon(coord), optionSimplify);
      cityGeoJson.features[0].geometry.coordinates[city_part_id++] = simplified.geometry.coordinates;
    }
  } else {
    let simplified = turf.simplify(turf.polygon(cityGeoJson.features[0].geometry.coordinates), optionSimplify);
    cityGeoJson.features[0].geometry.coordinates = simplified.geometry.coordinates;
  }
}

/**
 * [showDataVoronoi description]
 * @param  {[type]} lat [description]
 * @param  {[type]} lon [description]
 * @return {[type]}     [description]
 */
async function createCityAndMenu(lat, lon) {
  // Affiche la carte
  let stamenToner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by Stamen Design, CC BY 3.0 - Map data © OpenStreetMap',
    subdomains: 'abcd',
    minZoom: 10,
    maxZoom: 20,
    ext: 'png'
  });

  // clear map and fill it
  fillMapInnerHTML('');
  map = new L.Map("map", {
    layers: [stamenToner]
  });

  // Get city geojson with lat / lon
  cityGeoJson = await getCityByLatLng(lat, lon);
  if (cityGeoJson == null) {
    map.setView(L.latLng(lat, lon), zoom = 11);
    return;
  }

  // Get only the first element
  let city = L.geoJson(cityGeoJson.features[0]);
  city.addTo(map);
  map.fitBounds(city.getBounds());

  // Ajout legende statique
  let legend = L.control({position: 'bottomright'});
  legend.onAdd = function(map) {
    let div = L.DomUtil.create('div', 'info legend'),
      grades = [0, 0.1, 0.2, 0.4, 0.8, 2, 4, 10];

    div.innerHTML += '<h6>En ha</h6>';
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(grades[i] * 10000 + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? 'ha – ' + grades[i + 1] + 'ha <br>' : '+');
    }
    return div;
  };
  legend.addTo(map);

  // Ajout d'un paneau de commande
  let cityname = cityGeoJson.features[0].properties.address.city || cityGeoJson.features[0].properties.address.municipality;
  var command = L.control({
    position: 'topright'
  });
  command.onAdd = function(map) {
    let div = L.DomUtil.create('div', 'command');
    let divHead = L.DomUtil.create('div', 'command-text', div);
    let spanTitle = L.DomUtil.create('span', 'command-span-title', divHead);
    spanTitle.innerHTML = "Points d\'intérêt<br/>";
    let spanCity = L.DomUtil.create('span', 'command-span-city', divHead);
    spanCity.innerHTML = '(' + cityname + ')';

    let divAmenityType = L.DomUtil.create('div', 'command-text', div);
    divAmenityType.id = 'amenity-text';
    let selected_amenity=getCurrentAmenity();
    divAmenityType.innerHTML = elemDescr[selected_amenity].descr;

    let divPOI = L.DomUtil.create('div', 'command-text', div);
    divPOI.id = "nbPOI"
    return div;
  };
  command.addTo(map);

  var sidebar = L.control
    .sidebar({ container: "sidebar", position: "left" })
    .addTo(map);
}


function getCurrentAmenity() {
  let radioboxes = document.getElementsByName("amenity-radio");
  let selected_amenity='';
  radioboxes.forEach( radio => {if(radio.checked){selected_amenity=radio.value}});
  return selected_amenity;
}


/**
 * [showDataVoronoi description]
 * @param  {[type]} lat [description]
 * @param  {[type]} lon [description]
 * @return {[type]}     [description]
 */
async function showDataVoronoi(lat, lon) {
  // Create map and menu
  await createCityAndMenu(lat, lon);
  // get amenity select and compute voronoi representation
  //let selected_amenity = document.getElementById('amenity-select').value;
  let radioboxes = document.getElementsByName("amenity-radio");
  let selected_amenity=getCurrentAmenity();
  //radioboxes.forEach( radio => {if(radio.checked){selected_amenity=radio.value}});
  await simplifyCity();
  await computeVoronoi(selected_amenity);
}
