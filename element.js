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




  // create content
  /*
  let div_content = L.DomUtil.create('div', 'sb_content', div_sidebar);
  div_content.className = 'leaflet-sidebar-content';
  // HOME
  let div_content_home = L.DomUtil.create('div', 'home', div_content);
  div_content_home.className = 'leaflet-sidebar-pane';
  div_content_home.innerHTML += '<h1 class="leaflet-sidebar-header">Amenity Visu<span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span></h1>';
  div_content_home.innerHTML += '<p>A responsive sidebar for mapping libraries like<a href="https://leafletjs.com/">Leaflet</a>.</p>'

  let lorem_ipsum = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam \
  nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam \
  erat, sed diam voluptua. At vero eos et accusam et justo duo dolores \
  et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est \
  Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur \
  sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore \
  et dolore magna aliquyam erat, sed diam voluptua. At vero eos et \
  accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, \
  no sea takimata sanctus est Lorem ipsum dolor sit amet.';

  div_content_home.innerHTML += '<p class="lorem">'+lorem_ipsum+'</p>'
  div_content_home.innerHTML += '<p class="lorem">'+lorem_ipsum+'</p>'
  div_content_home.innerHTML += '<p class="lorem">'+lorem_ipsum+'</p>'
  div_content_home.innerHTML += '<p class="lorem">'+lorem_ipsum+'</p>'

  // OTHER
  let div_content_amenity = L.DomUtil.create('div', 'sb_content_amenity', div_content);
  div_content_amenity.className = 'leaflet-sidebar-pane';
  div_content_amenity.innerHTML += '<h1 class="leaflet-sidebar-header">Messages<span class="leaflet-sidebar-close"><i class="fa fa-caret-left"></i></span></h1>';
  div_content_amenity.innerHTML += ' \
    <form> \
      <fieldset id="amenity_choice"> \
        <legend>Choose your favorite monster</legend> \
        <input type="radio" id="kraken" name="monster" onchange="handleClick(this);"> \
        <label for="kraken">Kraken</label><br /> \
        <input type="radio" id="sasquatch" name="monster" onchange="handleClick(this);"> \
        <label for="sasquatch">Sasquatch</label><br /> \
        <input type="radio" id="mothman" name="monster" onchange="handleClick(this);"> \
        <label for="mothman">Mothman</label> \
      </fieldset>\
    </form>';
    */
}
