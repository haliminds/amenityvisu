const elemDescr = {
  "bicyleParking": {
    "descr": "Arceau à vélos",
    "code": ["amenity=bicycle_parking"]
  },
  "bench": {
    "descr": "Banc",
    "code": ["amenity=bench"]
  },
  "toilets": {
    "descr": "Toilette",
    "code": ["amenity=toilets"]
  },
  "wasteBasket": {
    "descr": "Poubelle",
    "code": ["amenity=waste_basket"]
  },
	"surveillance" : {
		"descr": "Caméra de surveillance",
		"code": ["man_made=surveillance"]
	}

};


function createSideBar() {
  let id_home = 'home';
  let id_amenity = 'sb_amenity';

  // create tabs
  let div_tabs = document.getElementById('sidebar-tabs');
  div_tabs.innerHTML += '<ul role="tablist"> \
  <li><a href="#'+id_home+'" role="tab"><img alt="Home" src="assets/img/sb-home.png"></a></li> \
  <li><a href="#'+id_amenity+'" role="tab"><img alt="Home" src="assets/img/sb-pois.png"></i></a></li> \
  </ul>';

  // create element for Home
  let div_sidebar_content = document.getElementById('sidebar-content');
  let div_content_home = L.DomUtil.create('div', 'leaflet-sidebar-pane', div_sidebar_content);
  div_content_home.id = id_home;

  //let div_content_home = document.getElementById('home');
  div_content_home.innerHTML += '<h1 class="leaflet-sidebar-header">Amenity Visu<span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span></h1>';
  div_content_home.innerHTML += '<p>AmenityVisu est un projet de visualisation de données cartographiques, permettant de voir la répartition géographiques des données OpenStreetMap à l\'échelle de la commune.</p>';
  div_content_home.innerHTML += '<p>Chaque zone, calculée grâce à un pavage de <a href="https://fr.wikipedia.org/wiki/Diagramme_de_Vorono%C3%AF">Voronoï</a> ne contient qu\'un seul et unique élément et quelque soit sa position dans la zone, cet élement sera le plus proche (à vol d\'oiseau).</p>';
  div_content_home.innerHTML += '<p>De ce fait, les grandes zones montreront, soit une absence "réelle" d\'éléments, soit une absence numérique (élément présent sur le terrain mais non enregistré dans OpenStreetMap).</p>';

  // create element for Home
  let div_content_amenity = L.DomUtil.create('div', 'leaflet-sidebar-pane', div_sidebar_content);
  div_content_amenity.id = id_amenity;
  div_content_amenity.innerHTML += '<h1 class="leaflet-sidebar-header">Points d\'intérêt<span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span></h1><br>';

  let amenity_option = '';
  let checked = 'checked';
  for (let amenity in elemDescr) {
    amenity_option += '<input type="radio" id='+amenity+' name="amenity-radio" value='+amenity+' onchange="computeVoronoi(this.value);" '+checked+'><label for='+amenity+'>'+elemDescr[amenity].descr+'</label><br>'
    checked = '';
  }

  div_content_amenity.innerHTML += '\
  <form>\
    <fieldset id="field-amenity">\
      <legend>Choisissez les points d\'intérêt à afficher:</legend>\
      '+amenity_option+'\
    </fieldset>\
  </form>';


}
