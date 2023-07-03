import { selector, mapOptions, activeStyle, regionStyle} from "./config.js";
import * as utils from "./utils.js";

const geojson = utils.loadBoundary('./data/boundary.json');
const adm0 = geojson.features.filter(function(item){
        if (item.properties.Level == 'ADM_0') {return item}
    })
const adm1 = geojson.features.filter(function(item){
        if (item.properties.Level == 'ADM_1') {return item}
    })
const tb_val = utils.loadData("./data/impact_table.json");
const about = utils.loadText('./src/about.inc');
const glossary = utils.loadData('./src/glossary.inc');
const filterParam = utils.getParameters(tb_val, selector);
const basemaps = {
    "carto": L.tileLayer(
        "https://cartodb-basemaps-b.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            minZoom: 2,
            maxZoom: 14,
        }),
    "voyager": L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '<a href="https://www.openstreetmap.org/copyright">OSM</a> | <a href="https://carto.com/attributions">CARTO</a> | <a href="https://sdi.worldpop.org" target="_blank">WorldPop SDI</a>',
            subdomains: 'abcd',
            minZoom: 2,
            maxZoom: 14
        })
};
const cartoLabels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    //'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
    pane: 'labels'
});

//Initializing filter panel
utils.initFilter($('#controlBody'), filterParam, glossary);

//Initializing map and its layers
mapOptions.layers = [basemaps.carto];
var map = L.map('map', mapOptions);
var scale = L.control.scale({position:'bottomright'});

L.control.zoom({position:'bottomleft', zIndex:300}).addTo(map);
L.DomEvent.disableClickPropagation(rightPanel);
L.DomEvent.disableClickPropagation(leftPanel);

map.invalidateSize();
map.createPane('labels');
map.getPane('labels').style.zIndex = 500;
map.getPane('labels').style.pointerEvents = 'none';
console.log(map.getPane('labels').style.zIndex)
//Defining layers
//countryLayer is for country boundary (styled with activeStyle or inactiveStyle)
//regionLayer is for admin-1 boundary (styled with regionStyle)
//markerGroup is for divIcon containing the number of evaluation per country and available GPS

var mapParams;
var countryLayer = L.geoJson(null, {
    style: activeStyle,
    onEachFeature: function (feature, layer) {
        let tooltip = L.tooltip();
        layer.on({
            mouseover: function (e) {
                layer.setStyle({weight:2})
                tooltip.setLatLng([e.target.feature.properties.Lat, e.target.feature.properties.Lon])
                .setContent(e.target.feature.properties.Country)
                .addTo(map);
            },
            mouseout: function(e) {
                layer.setStyle({weight:1});
                tooltip.remove();
            },
            click: function(e) {
                utils.selectCountry(e, mapParams)
            }
        });
    }
}).addTo(map);
var regionLayer = L.geoJson(null, {
    style: regionStyle,
    onEachFeature: function (feature, layer) {
        let tooltip = L.tooltip();
        layer.on({
            mouseover: function (e) {
                layer.setStyle({weight:2})
                tooltip.setLatLng([e.target.feature.properties.Lat, e.target.feature.properties.Lon])
                .setContent(e.target.feature.properties.Region)
                .addTo(map);
            },
            mouseout: function(e) {
                layer.setStyle({weight:1});
                tooltip.remove();
            },
            click: function (e) {}
        });
    }
});
var markerGroup = L.layerGroup({style:{zIndex:550}}).addTo(map);

countryLayer.addData(adm0);
regionLayer.addData(adm1);

mapParams = {
    data: tb_val,
    map: map,
    countryLayer: countryLayer,
    regionLayer: regionLayer,
    markerGroup: markerGroup,
    autoZoom: true,
    fitPadding: {
        'paddingTopLeft': [0,20],
        'paddingBottomRight': [0,0]
    }
}

window.showDetails = function(id){utils.showDetails(id, mapParams)}
window.showMulti = function(id){utils.showMulti(id, mapParams)}
window.showGPS = function(id){utils.showGPS(id, mapParams)}
window.unhide = function(obj){
    let elem = $('#'+obj.getAttribute('data-target'));
    if (elem.attr('hidden') == 'hidden'){
        elem.removeAttr('hidden')
        obj.innerText = 'hide the list'
    } else {
        elem.attr('hidden', 'hidden')
        obj.innerText = 'show the list'
    }
}
utils.addMarkers(tb_val, mapParams);

//Event listeners
//Updating data filter

$('#leftPanel').css('display', 'block');

$('select').change(function(){
    if(this.id == 'idSelectCountry' && this.value != '0'){
        utils.updateFilter(this.value, mapParams);
    } else {
        utils.updateFilter(null, mapParams);
    }
});

$('#btnAbout').click(function(){utils.showAbout(about)});
$('#btnGlossary').click(function(){utils.showGlossary(glossary)});
$('#btnReset').click(function(){utils.resetFilter(mapParams)});

//Close button
$('.bclose').click(function(){
    let target = this.getAttribute('data-target');
    $(target).hide('fast');
})

//Minimize or maximize button
$('.bmini').click(function(){
    let target = this.getAttribute('data-target');
    if ($(target).is(':visible')) {
        this.innerHTML = '<span class="fa fa-chevron-circle-down"></span>';
        this.setAttribute('title', 'Show Content');
        $(target).hide('fast');
    } else {
        this.innerHTML = '<span class="fa fa-chevron-circle-up"></span>';
        this.setAttribute('title', 'Hide Content');
        $(target).show('fast');
    }
})

//Show labels on the map
$('#countryLabels').change(function () {
    if ($(this).is(":checked")) {
        map.addLayer(cartoLabels);
    } else {
        map.removeLayer(cartoLabels);
    }
});

//Show scale bar on the map
$('#scale').change(function () {
    if ($(this).is(":checked")) {
        scale.addTo(map);
    } else {
        scale.remove();
    }
});

//Toggle auto-zoom feature
$('#autoZoom').change(function () {
    if ($(this).is(":checked")) {
        mapParams.autoZoom = true;
    } else {
        mapParams.autoZoom = false;
    }
});