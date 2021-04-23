/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function esriMapScopeWrapper($) {
    require([
        'esri/Map',
        'esri/tasks/Locator',
        'esri/views/MapView',       
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/TextSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/geometry/support/webMercatorUtils',
        'dojo/domReady!'
    ], function requireCallback(
         Map, Locator, MapView,
        Graphic, Point, TextSymbol,
        PictureMarkerSymbol, webMercatorUtils
    ) {
        //esriConfig.apiKey = "AAPK3927cbe91e6e47b4b92d96e722b1bf36dR9LLwn5L2XycTKb6--zMnWFFsmTGnNzvd6fHWdI3DTLlQG7IjUMRObN_Dejx_b3";

        var wrMap = WildRydes.map;

        var map = new Map({ basemap: 'streets' });

        var locatorTask = new Locator({
            url: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
        });

        var view = new MapView({
            center: [-122.31, 47.60],
            container: 'map',
            map: map,
            zoom: 12
        });

        

        var pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
                size: 20,
                family: 'CalciteWebCoreIcons'
            }
        });

        var unicornSymbol = new PictureMarkerSymbol({
            url: '/images/unicorn-icon.png',
            width: '25px',
            height: '25px'
        });

        var pinGraphic;
        var unicornGraphic;

        function updateCenter(newValue) {
            wrMap.center = {
                latitude: newValue.latitude,
                longitude: newValue.longitude
            };
        }

        function updateExtent(newValue) {
            var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
            var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
            wrMap.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('extent', updateExtent);
        view.watch('center', updateCenter);
        view.then(function onViewLoad() {
            updateExtent(view.extent);
            updateCenter(view.center);
        });

        view.popup.autoOpenEnabled = false;
        view.on('click', function handleViewClick(event) {
            wrMap.selectedPoint = event.mapPoint;
            //view.graphics.remove(popup);

            const params = {
                location: event.mapPoint
            };

            $(wrMap).trigger('pickupChange');    

            locatorTask.locationToAddress(params)
                .then(function(response) { // Show the address found
                    const address = response.address;
                    showAddress(address, event.mapPoint);
                }, function(err) { // Show no address found
                    showAddress("No address found.", event.mapPoint);
                });
            });

        function showAddress(address, pt) {
            view.popup.open({
                title:  + Math.round(pt.longitude * 100000)/100000 + ", " + Math.round(pt.latitude * 100000)/100000,
                content: address,
                location: pt
            });
        };          
        
        wrMap.animate = function animate(origin, dest, callback) {
            var startTime;
            var step = function animateFrame(timestamp) {
                var progress;
                var progressPct;
                var point;
                var deltaLat;
                var deltaLon;
                if (!startTime) startTime = timestamp;
                progress = timestamp - startTime;
                progressPct = Math.min(progress / 2000, 1);
                deltaLat = (dest.latitude - origin.latitude) * progressPct;
                deltaLon = (dest.longitude - origin.longitude) * progressPct;
                point = new Point({
                    longitude: origin.longitude + deltaLon,
                    latitude: origin.latitude + deltaLat
                });
                view.graphics.remove(unicornGraphic);
                unicornGraphic = new Graphic({
                    geometry: point,
                    symbol: unicornSymbol
                });
                view.graphics.add(unicornGraphic);
                if (progressPct < 1) {
                    requestAnimationFrame(step);
                } else {
                    callback();
                }
            };
            requestAnimationFrame(step);
        };

        wrMap.unsetLocation = function unsetLocation() {
            view.graphics.remove(pinGraphic);
        };
    });
}(jQuery));
