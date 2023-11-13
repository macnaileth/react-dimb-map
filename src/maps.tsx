import React, { useEffect, useState } from 'react';

import MapComponent from './components/Map'
import GeoJsonFeatureCollectionType from './interfaces/geoJsonFeatureCollection';

import LoadSpinner from './components/Loadspinner'
import './css/global.css';

interface Result {
    data: GeoJsonFeatureCollectionType;
};

const Maps = () => {

    const [geoData, setGeoData] = useState();

    const mapData = async () => {
        const url = `https://dimb-api-20230512.netlify.app/api/igs?simplify=0.005`;
        const result = await fetch(url);  
        return await result.json();
    }
    const resData = async () => {
        const fmapData = await mapData();
        setGeoData( () => { return { ...fmapData } } );
        console.log( 'MapData retrieved:', fmapData );
    }
    useEffect(() => {
        geoData === undefined && resData();
    }, []);

    return geoData === undefined ? <LoadSpinner /> : <MapComponent data={ geoData } />
}

export default Maps