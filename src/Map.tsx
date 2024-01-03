import * as React from 'react';
import { MapContainer, GeoJSON, Marker, CircleMarker, Popup, Pane, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import table from './data/impact_table.json';
import boundary from './data/boundary.json';
import { onlyUnique } from './utils';
import { activeStyle, regionStyle, columns } from './config';  
import * as L from 'leaflet';

var main_map: any;

const basemaps = {
    'esri':'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    'label':'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
    'positron': 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
}

const showLabel = false;

export function TheMap({ filterParam_, setState_, filteredTable_ }){
    let countries = [];
    if (filterParam_.countries[0] === 'all') {
        filteredTable_.forEach((row) => countries.push(row['CountryID'].toLowerCase().split(', ')));
        countries = countries.flat();
    } else {
        countries = filterParam_.countries
    }

    const countryBoundary = boundary.features.filter((item) => {
        let selected = item.properties.Level === 'ADM_0';
        selected = selected && (countries.includes(item.properties.CountryID.toLowerCase()))
        return selected;
    });

    const regionBoundary = boundary.features.filter((item) => {
        let selected = item.properties.Level === 'ADM_1';
        if (filterParam_.regions.length > 0) {
            selected = selected && (filterParam_.regions.includes(item.properties.RegionID))
        } else {
            selected = false;
        }
        return selected;
    })

    let points = table.filter((item) => item.EvaluationID == filterParam_.id);
    let coords = [];
    if (points.length >0 && points[0]['Coord'] !== ''){
        points = JSON.parse(points[0]['Coord'].replace(/'/g, '"'));
        Object.keys(points).forEach((key) => {
            if (key.replaceAll(' ','').toLowerCase() === filterParam_.country){
                coords = points[key];
            }
        })
    }

    const bounds = React.useMemo(() => {
        let bounds_ = [[90,180],[-90,-180]];
        countryBoundary.forEach((item) => {
            bounds_[0][0] = Math.min(item.properties.Lat-2, bounds_[0][0])
            bounds_[0][1] = Math.min(item.properties.Lon-5, bounds_[0][1])
            bounds_[1][0] = Math.max(item.properties.Lat+2, bounds_[1][0])
            bounds_[1][1] = Math.max(item.properties.Lon+5, bounds_[1][1])
        })
        return bounds_
    }, [countryBoundary])

    const DefineMap = () => {
        main_map = useMap();
        //zoomFit(bounds);
        return null
        }

    const ref = React.useRef()
    React.useEffect(() => {
        if (ref.current) {
            ref.current.clearLayers()
            ref.current.addData(countryBoundary)
        }
    }, [ref, countryBoundary])

    const refRegion = React.useRef()
    React.useEffect(() => {
        if (refRegion.current) {
            refRegion.current.clearLayers()
            refRegion.current.addData(regionBoundary)
        }
    }, [ref, regionBoundary])

    const refPoint = React.useRef()
    React.useEffect(() => {
        if (refPoint.current) {
            refPoint.current.clearLayers()
            refPoint.current.addData(points)
        }
    }, [refPoint, points])

    const zoomFit = (bounds) => {
        main_map.fitBounds(bounds)
    }

    const selectCountry = (country) => {
        filterParam_.country = country;
        filterParam_.countries = [country];
        setState_(filterParam_, {replace: true});
    }
    
    let countryTally = {}
    filteredTable_.forEach((row) => {
        const countries = row.CountryID.split(', ');
        countries.forEach((key:string) => {
            countryTally[key] = countryTally[key] ? countryTally[key] + 1 : 1
        })
    })
    
    const countryMarker = (regionBoundary.length > 0) ? (<></>) :
    (<> {countryBoundary.map((row, i) => {
        const count = countryTally[row.properties.CountryID];
        const icon = L.divIcon({
            html: '<span><div class="cmarker">'+count+'</div></span>',
            className: ''
        })
        return <Marker 
            position={[row.properties.Lat, row.properties.Lon]}
            icon={icon}
            key={i}
        />
    })}</>);
    
    const onEachCountry = (feature, layer) => {        
        layer.on({
          mouseover: function(e){
            const prop = e.target.feature.properties;
            let content = `<div><b>${prop.Country}</b></div>`;
            layer.setStyle({weight:3})
            layer.bindTooltip(content)
            layer.openTooltip()
          },
          mouseout: function(e){
            layer.setStyle({weight:1})
            layer.closeTooltip()
          },
          click: function(e){
            layer.setStyle({weight:3})
            selectCountry(e.target.feature.properties.CountryID.toLowerCase())
            zoomFit(e.target._bounds)
          }
        })
    }
    
    const onEachRegion = (feature, layer) => {
        layer.bindTooltip(feature.properties.Region).addTo(main_map)
        layer.openTooltip()
    };

    return (
        <div id='mapContainer' className='main-content'>
            <MapContainer
                bounds={bounds}
                attributionControl={false}
                minZoom={3}
                maxZoom={10}
                zoomAnimation={true}
                style={{width:'100vw', height:'100vh', background:'#fff'}}
                >

                <DefineMap />
                
                <Pane name='basemap' style={{zIndex:1}}>
                    {<TileLayer url={basemaps['positron']}/>}
                </Pane>

                <Pane name='tiles' style={{zIndex:5}}>
                    <GeoJSON
                        data={countryBoundary}
                        style={activeStyle}
                        ref={ref}
                        onEachFeature={onEachCountry}
                        />
                </Pane>

                <Pane name='points' style={{zIndex:20}}>
                    {countryMarker}

                    <GeoJSON
                        data={regionBoundary}
                        style={regionStyle}
                        ref={refRegion}
                        onEachFeature={onEachRegion}
                    />                

                    {(coords.length > 0) ? (coords.map((c,i) => (
                        <CircleMarker
                            key={i} 
                            center={[c[1],c[0]]} 
                            radius={3}
                            color='#000'
                            opacity={0.9}
                            fillOpacity={0.9}
                            />))) : <></>}
                </Pane>
                {showLabel ? <TileLayer url={basemaps['label']} zIndex={50}/> : <></>}

            </MapContainer>
        </div>
    )
}