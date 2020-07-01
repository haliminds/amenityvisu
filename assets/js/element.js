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
	"cafeBar" : {
		"descr": "Café / Bar",
		"code": ["amenity=cafe", "amenity=bar"]
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
  <li><a href="#'+id_home+'" role="tab"><i class="fa fa-bars"></i></a></li> \
  <li><a href="#'+id_amenity+'" role="tab"><i class="fa fa-cog"></i></a></li> \
  </ul>';

  // create element for Home
  let div_sidebar_content = document.getElementById('sidebar-content');
  let div_content_home = L.DomUtil.create('div', 'leaflet-sidebar-pane', div_sidebar_content);
  div_content_home.id = id_home;

  //let div_content_home = document.getElementById('home');
  div_content_home.innerHTML += '<h1 class="leaflet-sidebar-header">Amenity Visu<span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span></h1>';
  div_content_home.innerHTML += '<p>Description du projet, du pavage de Voronoï, de la localisation, bref, de tout ce qui est possible de faire avec AmenityVisu</a>.</p>';

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
