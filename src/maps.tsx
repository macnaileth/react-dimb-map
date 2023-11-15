import React, { useEffect, useState } from 'react';

import MapComponent from './components/Map'
import GeoJsonFeatureCollectionType from './interfaces/geoJsonFeatureCollection';

import LoadSpinner from './components/Loadspinner'
import './css/global.css';

interface Result {
    data: GeoJsonFeatureCollectionType;
};

declare global {
    interface Window {
        mapconfig: any;
    }
}

const Maps = () => {

    //get global config
    const config = window.mapconfig;

    if ( config === undefined || config.length === 0 ) { 
        console.log( '%c*** No configuration available ***', 'color:red;' );  
        return <div style={{ display: 'none' }}>*** Map not displayed: No configuration available ***</div>
    } else {

        const [geoData, setGeoData] = useState();

        const mapData = async () => {
            const url = config.paths.api;
            const result = await fetch(url);  
            return await result.json();
        }
        const resData = async () => {
            const fmapData = await mapData();
            setGeoData( () => { return { ...fmapData } } );
        }
        useEffect(() => {
            geoData === undefined && resData();
        }, []);

        console.log( '%c*** map configuration loaded ***', 'color:green;' ); 

        return geoData === undefined ? <LoadSpinner display="Lade Karte..." /> : <MapComponent data={ geoData }  settings={ config } />
    }
}

export default Maps