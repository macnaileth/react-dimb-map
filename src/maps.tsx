import React from 'react';

import MapComponent from './components/Map'

import './css/global.css';

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

        const url = `${config.paths.baseUrl}/api/igs?simplified=0.004`;

        console.log( '%c*** map configuration loaded ***', 'color:green;' ); 

        return <MapComponent url={ url }  settings={ config }  controls={['search', 'locate']}  label={false}  />
    }
}

export default Maps