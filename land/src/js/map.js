
// This example creates a custom overlay called USGSOverlay, containing
// a U.S. Geological Survey (USGS) image of the relevant area on the map.

// Set the custom overlay object's prototype to a new instance
// of OverlayView. In effect, this will subclass the overlay class therefore
// it's simpler to load the API synchronously, using
// google.maps.event.addDomListener().
// Note that we set the prototype to an instance, rather than the
// parent class itself, because we do not wish to modify the parent class.

var overlay;
USGSOverlay.prototype = new google.maps.OverlayView();

// Initialize the map and the custom overlay.
map = null 

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: { lat: 39.167579, lng: -86.523527 },
    mapTypeId: 'roadmap'
  });

  var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(39.1609 , -86.53245),
    new google.maps.LatLng(39.1978, -86.4892));
//https://maps.googleapis.com/maps/api/place/textsearch/json?query=bloomington+point+of+interest&language=en&key=AIzaSyDCkJZdv5OWwtGv5BHqzZh4blml0huCoQE
  // The photograph is courtesy of the U.S. Geological Survey.
  var srcImage = '../images/iu.png';

  // var imuLatlng = { lat: 39.167579, lng: -86.523527 };

  // var marker = new google.maps.Marker({
  //   position: imuLatlng,
  //   map: map,
  //   title: 'Click to zoom'
  // });

  map.addListener('center_changed', function () {
    // 3 seconds after the center of the map has changed, pan back to the
    // marker.
    window.setTimeout(function () {
      //map.panTo(marker.getPosition());
    }, 15000);
  });

  
  
  // The custom USGSOverlay object contains the USGS image,
  // the bounds of the image, and a reference to the map.
  overlay = new USGSOverlay(bounds, srcImage, map);
}

var setMaker = (prop) => {
  var imuLatlng = { lat: prop.lat, lng: prop.long };

  var marker = new google.maps.Marker({
    position: imuLatlng,
    map: map,
    animation:google.maps.Animation.DROP,
    title: prop.name
  });

  marker.addListener('click', function () {
    map.setZoom(16);
    map.panTo(marker.getPosition());
    // map.setCenter(marker.getPosition());
    console.log(marker.title);
    buyTemplate =  `<div class="card border border-danger rounded">
    <div class="card-header">
      `+prop.name+`
    </div>
    <div class="card-body">
      `+prop.id+`
    </div>
  </div>`
  
    $("#listing").html(prop.template);
  });
}

/** @constructor */
function USGSOverlay(bounds, image, map) {

  // Initialize all properties.
  this.bounds_ = bounds;
  this.image_ = image;
  this.map_ = map;

  // Define a property to hold the image's div. We'll
  // actually create this div upon receipt of the onAdd()
  // method so we'll leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay.
  this.setMap(map);
}

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
USGSOverlay.prototype.onAdd = function () {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  // Create the img element and attach it to the div.
  var img = document.createElement('img');
  img.src = this.image_;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.position = 'absolute';
  img.style.opacity = '0.25;'
  div.appendChild(img);

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(div);
};

USGSOverlay.prototype.draw = function () {

  // We use the south-west and north-east
  // coordinates of the overlay to peg it to the correct position and size.
  // To do this, we need to retrieve the projection from the overlay.
  var overlayProjection = this.getProjection();

  // Retrieve the south-west and north-east coordinates of this overlay
  // in LatLngs and convert them to pixel coordinates.
  // We'll use these coordinates to resize the div.
  var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  // Resize the image's div to fit the indicated dimensions.
  var div = this.div_;
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  div.style.width = (ne.x - sw.x) + 'px';
  div.style.height = (sw.y - ne.y) + 'px';
};

// The onRemove() method will be called automatically from the API if
// we ever set the overlay's map property to 'null'.
USGSOverlay.prototype.onRemove = function () {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};

google.maps.event.addDomListener(window, 'load', initMap);

function testME(msg){
  console.log(msg);
  
}