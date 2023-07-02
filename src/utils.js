import * as _config from './config.js?v=1'

export var elements = {
    selectCountry: $('#idSelectCountry'),
    leftPanel: $('#leftPanel'),
    rightPanel: $('#rightPanel'),
    extraPanel: $('#extraPanel'),
    shortInfo: $('#shortInfo'),
    longInfo: $('#longInfo')
}

function verbose(obj){
    //console.log(obj);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function uniqueValue(obj, param){
    let result = {};
    param.forEach(function(col){
        let arr = [];
        obj.forEach(function(row){
            arr.push(row[col].replaceAll(' ','').split(','))
        })
        result[col] = arr.filter(onlyUnique).flat();
    })
    return(result);
}

export function initFilter(elem, param, terms){
    verbose("initFilter");
    for (let i in param){
        let sorted = param[i].sort();
        let j = i.replaceAll(' ','')
        let opt = '<option value="0" id=optZero'+j+'></option>';
        $.each(sorted, function(idx, val){
            let short = val.replaceAll(' ','');
            opt += '<option value=' +short+ ' id=opt' +short
            if (Object.keys(terms).includes(val)){
                opt += ' data-toggle="tooltip" data-placement="right" title="'
                opt += String(terms[val])+'">' +val+ '</option>'
            } else {
                opt += '>' +val+ '</option>'
            }
        })
        $(elem).append($('<div class="form-group mb-1"></div>')
            .append($("<label></label>").attr({class:"col-form-label-sm", for:"idSelect"+j}).text(i))
            .append($("<select></select>").attr({class:"form-select form-select-sm", id:"idSelect"+j,
                onfocus:"this.size=10;this.style='position:absolute;z-index:20';",
                onblur:"this.size=1;this.style='position:relative;z-index:15';",
                onchange:"this.size=1;this.style='position:relative;z-index:15';this.blur();",
                style:"position:relative;z-index:15",
            })
            .append(opt))
            )
    }

    initSetting('#modal');
}

function initSetting(elemID) {
    let content = '<div class="form-check form-switch">';
    content += '<div class="form-group"><input class="form-check-input" type="checkbox" id="countryLabels">'
    content += '<label class="form-check-label" for="countryLabels">Show labels</label></div>'
    content += '<div class="form-group"><input class="form-check-input" type="checkbox" id="scale">'
    content += '<label class="form-check-label" for="scale">Show scale</label></div><hr>'
    content += '<div class="form-group"><input class="form-check-input" type="checkbox" id="autoZoom" checked>'
    content += '<label class="form-check-label" for="autoZoom">Enable auto-zoom and center</label></div>'
    content +='</div>'

    showContent('Setting', content, [elemID, '']);
}

export function addMarkers(_tb, mapParam) {
    verbose('addMarkers');

    mapParam.markerGroup.clearLayers();
    if (mapParam.map.hasLayer(mapParam.countryLayer)) {
        mapParam.countryLayer.eachLayer(function (l) {
            let filtered = _tb.filter(function(item){
                let countries = item['CountryID'].replaceAll(' ','').split(',');
                return (countries.includes(l.feature.properties['CountryID']))
            })
            let count = (Object.keys(filtered).length);
            if ((count > 0) && (l.options.active == 'yes')) {
                let lon = l.feature.properties.Lon;
                let lat = l.feature.properties.Lat;
                let icon = L.divIcon({
                    html: '<span><div class="cmarker">'+count+'</div></span>',
                    className: ''
                })
                let marker = L.marker([lat,lon], {
                    icon: icon,
                    interactive: false,
                })
                marker.addTo(mapParam.markerGroup);
            }}
        )
    }
}

export function updateMap(countries, regions, mapParam) {
    verbose("updateMap");
    removeAllLayers(mapParam.markerGroup, mapParam.map);
    if (countries != null){
        countries = [countries].flat();
        let bounds = {'minx':[], 'miny':[], 'maxx':[], 'maxy':[], 'arr':null};
        mapParam.countryLayer.setStyle(_config.inactiveStyle);
        mapParam.countryLayer.eachLayer(function(l){
            let item = l.feature.properties;
            if (countries.includes(item['CountryID'])){
                bounds.minx.push(l._bounds._southWest.lng);
                bounds.miny.push(l._bounds._southWest.lat);
                bounds.maxx.push(l._bounds._northEast.lng);
                bounds.maxy.push(l._bounds._northEast.lat);
                l.setStyle(_config.activeStyle);
            } else if ((item['CountryID'] == 'Disputed') && (countries.includes('India') || (countries.includes('Pakistan')))){
                l.setStyle(_config.disputed);
            }
        })
        bounds.arr = [
            [Math.min.apply(Math, bounds.miny), Math.min.apply(Math, bounds.minx)],
            [Math.max.apply(Math, bounds.maxy), Math.max.apply(Math, bounds.maxx)]
        ]

        if (mapParam.autoZoom) {
            mapParam.map.fitBounds(bounds.arr, mapParam.fitPadding)
        }
    }

    let country = $('#idSelectCountry').val();
    mapParam.regionLayer.eachLayer(function(l){
        let item = l.feature.properties;
        l.remove();
        if ((regions != null) && (regions.includes(item['RegionID'])) && (country == item['CountryID'])){
            l.setStyle(_config.regionStyle).addTo(mapParam.map)
        }
    })
}

export function updateFilter(countries, mapParam) {
    verbose("updateFilter");
    elements.rightPanel.hide('fast');
    
    let tb = mapParam.data.filter(function(row){
        let res = true;
        _config.selector.map(function(col){
            let j = col.replace(' ','')
            let opt = $('#idSelect'+j).val().replaceAll(' ','');
            let itm = String(row[col]).replaceAll(' ','').split(',');
            if (opt != '0'){
                res = (res && itm.includes(opt))
            }
        })
        return res;
    })

    let unique = uniqueValue(tb, _config.selector);
    let active = Object.values(unique).flat();
    $('option').hide('fast');
    _config.selector.forEach(function(col){
        col = col.replaceAll(' ','');
        $('#optZero'+col).show('fast');
    })
    active.forEach(function(item){
        item = item.replaceAll(' ','');
        $('#opt'+item).show('fast');
    })

    if (countries == null){
        countries = tb.map(function(item){
            return item['CountryID'].replaceAll(' ','').split(',')
        });
        countries = countries.flat().filter(onlyUnique);
    }
    updateMap(countries, null, mapParam);
    addMarkers(tb, mapParam);
}

export function selectCountry(e, mapParam) {
    verbose("selectCountry");
    elements.extraPanel.hide('fast');
    let country = e.target.feature.properties.CountryID;
    $('#idSelectCountry').val(country);
    updateFilter(country, mapParam);
    showEvaluations(e.target.feature.properties.Country, mapParam);
}

export function resetFilter(mapParam) {
    verbose('resetFilter');
    $('select').val('0');
    updateFilter(null, mapParam);
}

export function showContent(title, body, elemID) {
    $(elemID[0] + 'Title').html(title);
    $(elemID[0] + 'Head').find('.bmini').html('<span class="fa fa-chevron-circle-up"></span>');
    $(elemID[0] + 'Body').html(body);
    $(elemID[0] + 'Body').show('fast');
    $(elemID[1]).show('fast');
}

export function showAbout(obj) {
    let content = '<div>' + obj + '</div>';
    elements.rightPanel.hide('fast');
    showContent('About', content, ['#extra', '#extraPanel']);
}

export function showGlossary(terms) {
    let tbody = ''
    for (let i in terms) {
        tbody += '<tr><td>'
        tbody += i + '</td><td>' + terms[i]
        tbody += '</td></tr>'
    }
    tbody = '<table class="table table-sm table-hover"><tbody>' + tbody + '</tbody></table>'
    
    elements.rightPanel.hide('fast');
    showContent('Glossary', tbody, ['#extra', '#extraPanel']);
}

export function showPrinting() {
    showAbout();
    window.print();
}

export function showDownload() {
    let content = '<div class="form-group mb-1">';
    content += '<label class="col-form-label-sm" for="idSelectDownload">File format</label>'
    content += '<select class="form-select form-select-sm" id="idSelectDownload">'
    content += '<option value="csv">CSV (comma-separated values)</option>'
    content += '<option value="xls">XLSX (XML spreadsheet)</option>'
    content += '<option value="json" selected>JSON (javascript object notation)</option>'
    content += '<option value="pdf">PDF (portable document format)</option>'
    content += '</select></div><div>'
    //content += '<a href="./data/impact_table.json" download>Download</a>'
    content += '<button type="submit" class="btn btn-sm btn-outline-danger" onclick="downloadFile()">Download</button></div>'

    elements.longInfo.hide('slow');
    elements.extraPanel.hide('fast');
    showContent('Download Impact Table', content, ['#short', '#rightPanel']);
}

export function downloadFile() {
    let fname = 'impact_table.' + $('#idSelectDownload').val();
    let a = document.createElement('a');
    a.href = './data/' + fname;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function loadData(url) {
    var json = $.getJSON({'url': url, 'async': false});
    return JSON.parse(json.responseText);
}

export function loadText(url) {
    var json = $.get({'url': url, 'async': false});
    return json.responseText;
}

export function loadBoundary(url) {
    verbose('loadBoundary');
    var result = "";
    $.ajax({
        url: url,
        async: false,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            result = data;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        },
        complete: function () {
            //_utils.progressMenuOff();
        }
    });
    return result;
}

export function getParameters(data, param){
    var result = {};
    param.map(function(col){
        let arr = []
        data.map(function(row){
            if ((!arr.includes(row[col])) && (!row[col]==[])) {
                arr.push(row[col].replaceAll(', ',',').split(','));
            }
        })
        arr = arr.flat().filter(onlyUnique);
        result[col] = arr.sort();
    })
    return(result)
}

function removeAllLayers(_layer, _map) {
    if (_map.hasLayer(_layer)) {
        _layer.eachLayer(
            function (l) {
                l.remove();
            });
    }
}

function showEvaluations(country, mapParam) {
    verbose("showEvaluations")
    let utils = {}
    var tb = mapParam.data.filter(function(row){
        let res = true;
        _config.selector.map(function(col){
            let j = col.replace(' ','')
            let opt = $('#idSelect'+j).val().replaceAll(' ','');
            let itm = String(row[col]).replaceAll(' ','').split(',');
            if (opt != '0'){
                res = (res && itm.includes(opt))
            }
        })
        return res;
    });

    let title = country//$('#idSelectCountry').val();
    let tbody = ''

    for (var i = 0; i < tb.length; i++){
        tbody += '<tr class="clickable" onclick="showDetails(' + tb[i]["EvaluationID"]
        tbody += ')" style="cursor: pointer;">';
        tbody += '<td>' + tb[i]['Sector'] + '</td>'
        tbody += '<td>' + tb[i]['Investment Name'] + '</td>'
        tbody += '</tr>'
    }
    
    tbody = '<table class="table table-sm table-hover"><thead><tr><th>Sector</th><th>Investment Name</th></tr></thead><tbody>' + tbody + '</tbody></table>'
    elements.longInfo.hide('slow');
    showContent(title, tbody, ['#short', '#rightPanel'])
};

export function showDetails(id, mapParam) {
    let country = $('#idSelectCountry').val();
    let tb = mapParam.data.filter(function(row){
        return (row['EvaluationID'] == id);
    })
    tb = tb[0]
    let title = tb["Investment Name"]
    let tbody = ''
    let regions = []

    tbody += '<tr><td colspan=2><i>'+tb['Proposed Public Title']+'</i></td></tr>'

    if (tb['Region'] == '') {
        tbody += '<tr><td><b> Remark </b></td><td>'
    } else {
        regions = JSON.parse(tb['Region'].replace(/'/g, '"'))[country];
        tbody += '<tr><td><b>Region</b></td>'
        tbody += '<td>' + regions.join(', ')
        regions = regions.map(function(item){return item.replaceAll(' ','')})
    }
    if (tb["GPS"] == "Yes") {
        tbody += '<p class="m-0 mt-1">Geo-coordinates of the '
        tbody += '<a href="#" title="click to show" onclick="showGPS('
        tbody += id + ')">locations</a> are available.</p>'
    }
    if (tb["Multi"] == "Yes") {
        tbody += '<p class="m-0 mt-1">This investment is implemented in several countries. '
        tbody += '<a href="#" onclick="showMulti(' + id + ')">Show the map</a> or '
        tbody += '<a href="#" onclick="unhide(this)" data-target="multiCountry">show the list</a>'
        tbody += '</p>'
        tbody += '<p id="multiCountry" hidden="hidden">' + tb['Country'] + '</p>'
    }

    //Except for 'Region' and 'Data Availability'
    _config.columns.slice(1,-2).map(function(col){
        tbody += '<tr><td><b>' + col + '</b></td>'
        tbody += '<td>' + tb[col] + '</td></tr>'
    })

    if (tb['Data Availability'] == 'Yes'){
        tbody += '<tr><td><b>Data Availability</b></td>'
        tbody += '<td>' + tb['Data Availability']
        tbody += '<p>Send <a href="mailto:info@ciff.org?subject=Data%20Request" target="_blank">e-mail</a>'
        tbody += ' to <a href="https://ciff.org/contact" target="_blank">CIFF</a>'
        tbody += ' for requesting the data'
        if (tb['Link'] != ''){
            tbody += ' or refer to ' + tb['Link'] + '.</p>'
        } else {
            tbody += '.</p>'
        }
        tbody += '</td></tr>'
    }

    _config.multicol.map(function(col){
        tbody += '<tr><td colspan=2><b>'+col+'</b><br>'
        tbody += tb[col] + '</td>'
        tbody += '</tr>'
    })
    
    tbody = '<table class="table table-sm"><tbody>' + tbody + '</tbody></table>'
    showContent(title, tbody, ['#long', '#longInfo']);
    updateMap(country, regions, mapParam);
};

export function showMulti(id, mapParam) {
    verbose('showMulti');
    let tb = mapParam.data.filter(function(item){
        return (item["EvaluationID"] == id);
    })
    tb = tb[0];
    let countries = tb['CountryID'].replaceAll(' ','').split(',');
    updateMap(countries, null, mapParam);
    addMarkers([tb], mapParam);
}

export function showGPS(id, mapParam) {
    verbose('showGPS');
    let tb = mapParam.data.filter(function(row){
        return (row['EvaluationID'] == id);
    })

    let country = $('#idSelectCountry').val();
    let coord = JSON.parse(tb[0]['Coord'].replace(/'/g, '"'))[country]

    mapParam.markerGroup.clearLayers();
    let marker = coord.map(function(item){
        mapParam.markerGroup.addLayer(L.circleMarker([item[1],item[0]], _config.pointStyle));
    })
    mapParam.markerGroup.addTo(mapParam.map);
}
