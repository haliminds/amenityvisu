/**
 *
 *
 */

let map = "";
let cityGeoJson = "";


/**
 * [initialize description]
 * @return {[type]} [description]
 */
function initialize(loaderGif) {
  createSideBar();
  // before showing the map, show a gif
  fillMapInnerHTML("<img src=\"" + loaderGif + "\"/>");

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
      fillMapInnerHTML('<div class=\"no-gps\">GPS non activé !</div>');
    }, geoOptions);
  } else {
    // Fallback for no geolocation
    fillMapInnerHTML('<div class=\"no-gps\">GPS non activé !</div>');
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
 * [eliminateDuplicatesPoints description]
 * @param  {[type]} points_list [description]
 * @return {[type]}             [description]
 */
function eliminateDuplicatesPoints(points_list) {
  let obj = {};
  // convert elements in key (string) to eliminate redundant values
  points_list.forEach(item => {
    obj[item] = item;
  });
  return Object.values(obj)
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

  let div_amenity_txt = document.getElementById('amenity-text');
  div_amenity_txt.innerHTML = elemDescr[amenity].descr;

  await removeMarkers(map, "voronoi");
  await removeMarkers(map, "amenity_pt");

  // Get all elements of city with OverPassTurbo
  let elementData = await getAmenityByOverPass(cityGeoJson.code, amenity)

  // chargement des points et transformation du tableau en objet
  var points = [];
  elementData.features.forEach(elem => points.push(elem.geometry.coordinates));
  points = eliminateDuplicatesPoints(points);

  // Update command
  const elemNbTxt = ((points.length > 1) ? " éléments référencés)" : " élément référencé)");
  div_nbPOI.innerHTML = "(" + points.length + elemNbTxt;

  let city = L.geoJson(cityGeoJson.contour);
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
  // on cree le diagramme de voronoi a partir des data
  let voronoiPolygons = await d3.voronoi().extent(boundd3js).polygons(points);
  //const voronoiPolygons_ = await d3.Delaunay.from(points).voronoi(boundd3js);

  // pour chaque polygone, on cree un geojson qu'on intégre dans la carte
  //var t0 = performance.now();

  //for (let zone of voronoiPolygons_.cellPolygons()) {
  for (let zone of voronoiPolygons) {
    if (zone == undefined) {
      continue;
    }
    // on cree des vrais polygones avec le premier et dernier elements egaux
    zone.push(zone[0]);
    //on calcule l'intersection de la zone avec celle de la commune entière
    let intersect_arr = martinez.intersection(cityGeoJson.contour.coordinates, [zone]);

    // Pour chaque zone, on affiche la zone ainsi que le seed de la zone
    let geojsonMarkerOptions = {
      radius: 3,
      fillColor: "#ff0000",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 1
    };

    // let seed_pt = [voronoiPolygons_.delaunay.points[2 * pts_idx], voronoiPolygons_.delaunay.points[1 + 2 * (pts_idx++)]];
    let seed_pt = zone.data;
    for (let intersect_part of intersect_arr) {
      // si l'element est dans la zone, on calcule son aire sinon, on met cette aire au max.
      let area = ((d3.polygonContains(intersect_part[0], seed_pt)) ? computePolygonArea(intersect_part[0]) * 1000 * 1000 : 1e7);
      let interseect_zone = {
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "tag": "voronoi",
          "geometry": {
            "type": "Polygon",
            "coordinates": []
          },
          "properties": 0
        }]
      };

      interseect_zone.features[0].properties = {
        "area": area,
        "amenity_coord": seed_pt
      };
      interseect_zone.features[0].geometry.coordinates = intersect_part;
      L.geoJson(interseect_zone, {
        style: quadrangleStyle,
        //onEachFeature: onEachFeature
      }).addTo(map);

      //
      let amenity_point = {
        "type": "Feature",
        "tag": "amenity_pt",
        "geometry": {
          "type": "Point",
          "coordinates": seed_pt
        }
      };
      L.geoJson(amenity_point, {
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, geojsonMarkerOptions);
        }
      }).addTo(map);

    }
  };

  /*var t1 = performance.now();
  console.log("Call to compute polygon " + (t1 - t0) + " milliseconds.");*/
}


/**
 * [quadrangleStyle description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
function quadrangleStyle(feature) {
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
  return d > 100000 ? '#4575b4' :
    d > 40000 ? '#74add1' :
    d > 20000 ? '#abd9e9' :
    d > 8000 ? '#e0f3f8' :
    d > 4000 ? '#fee090' :
    d > 2000 ? '#fdae61' :
    d > 1000 ? '#f46d43' :
    '#d73027';
};

/**
 * [removeMarkers description]
 * @param  {[type]} map [description]
 * @param  {[type]} tag [description]
 * @return {[type]}     [description]
 */
async function removeMarkers(map, tag) {
  map.eachLayer(layer => {
    if (layer.feature && layer.feature.tag && layer.feature.tag === tag) {
      map.removeLayer(layer);
    }

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
  // if multipolygon, simplify each polygon
  if (cityGeoJson.contour.coordinates.length > 1) {
    cityGeoJson.contour.coordinates.forEach((coord, i) => {
      let simplified = simplify(coord, optionSimplify);
      cityGeoJson.contour.coordinates[i] = simplified;
    });
  } else {
    let simplified = simplify(cityGeoJson.contour.coordinates, optionSimplify);
    cityGeoJson.contour.coordinates = simplified;
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
  let stamenToner = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 10,
    maxZoom: 19,
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
  let city = L.geoJson(cityGeoJson.contour);
  let cityName = cityGeoJson.nom;

  city.addTo(map);
  map.fitBounds(city.getBounds());

  // Ajout legende statique
  let legend = L.control({
    position: 'bottomright'
  });
  legend.onAdd = function(map) {
    let div = L.DomUtil.create('div', 'legend'),
      grades = ['0.0', '0.1', '0.2', '0.4', '0.8', '2.0', '4.0', '10'];

    div.innerHTML += '<h6>En ha</h6>';
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(parseFloat(grades[i]) * 10000 + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? ' – ' + grades[i + 1] + '<br>' : '+');
    }
    return div;
  };
  legend.addTo(map);

  // Ajout d'un paneau de commande
  let command = L.control({
    position: 'topright'
  });

  command.onAdd = function(map) {
    let div = L.DomUtil.create('div', 'command');
    let divHead = L.DomUtil.create('div', 'command-text', div);
    let spanTitle = L.DomUtil.create('span', 'command-span-title', divHead);
    spanTitle.innerHTML = "Points d\'intérêt<br/>";
    let spanCity = L.DomUtil.create('span', 'command-span-city', divHead);
    spanCity.innerHTML = `(${cityName})`;

    let divAmenityType = L.DomUtil.create('div', 'command-span-type', div);
    divAmenityType.id = 'amenity-text';
    let selected_amenity = getCurrentAmenity();
    divAmenityType.innerHTML = elemDescr[selected_amenity].descr;

    let divPOI = L.DomUtil.create('div', 'command-span-nbPOI', div);
    divPOI.id = "nbPOI"
    return div;
  };
  command.addTo(map);

  var sidebar = L.control
    .sidebar({
      container: "sidebar",
      position: "left"
    })
    .addTo(map);

  map.on('click', function() {
    sidebar.close();
  });

  let controlscale = L.control.scale({
    metric: true,
    imperial: false,
    position: 'bottomleft'
  }).addTo(map);
}

/**
 * [getCurrentAmenity description]
 * @return {[type]} [description]
 */
function getCurrentAmenity() {
  let radioboxes = document.getElementsByName("amenity-radio");
  let selected_amenity = '';
  radioboxes.forEach(radio => {
    if (radio.checked) {
      selected_amenity = radio.value
    }
  });
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
  let selected_amenity = getCurrentAmenity();
  //radioboxes.forEach( radio => {if(radio.checked){selected_amenity=radio.value}});
  await simplifyCity();
  await computeVoronoi(selected_amenity);
}
