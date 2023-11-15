import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { transformExtent } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import Select from 'ol/interaction/Select.js';
import "ol/ol.css";
import GeoJsonFeatureCollectionType from '../interfaces/geoJsonFeatureCollection';
import Icons from './Icons';

interface Result {
    data: GeoJsonFeatureCollectionType;
    settings: any;
}

interface PopupContent {
    name?: string;
    url?: string;
    description?: string;
    logo?: string;
    email?: string;
    website?: string;
    activities?: string[];
}

function MapComponent( { data, settings }: Result ) {
    const [ map, setMap ] = useState<Map>();
    const [ popupContent, setPopupContent ] = useState<PopupContent>({});

    const mapElement = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map>();
    mapRef.current = map;

    useEffect(() => {
      if (mapElement.current) {
        const vectorLayer = new VectorLayer({
          source: new VectorSource({
            features: new GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(data),
          }),
          style: new Style({
            fill: new Fill({
              color: 'rgba(' + settings.style.featFillRGB + ', ' + settings.style.featFillAlpha + ')',
            }),
            stroke: new Stroke({
              color: 'rgb(' + settings.style.featStrokeRGB + ')',
              width: settings.style.featStrokeWidth,
            }),
          }),
        });

        const newMap = new Map({
          target: mapElement.current,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            vectorLayer,
          ],
        });

        const view: View = newMap.getView();
        const { bbox } = data.properties;
        const bboxTransformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
        view.fit(bboxTransformed, {
          size: newMap.getSize()!,
          padding: [50, 50, 50, 50],
        });
        newMap.on('click', handleMapClick);
        setMap(newMap);

        return () => {
          newMap.setTarget('');
        };
      }
    }, [data]);

    const handleMapClick = (event: any): void => {
      if (mapRef.current) {
        const feature = mapRef.current.forEachFeatureAtPixel(event.pixel, (feature) => {
            return feature;
        });
        if (feature) {
          const properties = feature.getProperties();
          const { 
            name,
            url,
            activities, 
            'logo-url': logo, 
            contact: email, 
            description, 
            'site-url': website  
          } = properties;
          const popupContent = {
            name,
            url,
            description,
            logo: logo?.thumb || logo || '',
            activities,
            email,
            website,
          }
          setPopupContent(popupContent);

        } else {
          setPopupContent({});
        }
      }
    };
    return (
      <div className={ "map-container" + ( settings.addClasses === '' ? '' : ' ' + settings.addClasses ) }>
        <div id="map" ref={mapElement} style={{ height: settings.height + 'px' }} />
        <div id="popup">
          {popupContent.name && (
            <div className="popup-container">
              <div className="popup-close" onClick={ () => setPopupContent({}) } ></div>
              <div className="popup-heading">
                  {popupContent.logo && (
                    <div className="popup-logo">
                      <img src={popupContent.logo} alt={popupContent.name} />
                    </div>
                  )}
                  <div className="popup-name">
                      <h2 style={{ color: 'rgb(' + settings.style.headlineRGB + ')' }}>{popupContent.name}</h2>
                  </div>
              </div>
              <div className="popup-content" style={{ color: 'rgb(' + settings.style.textRGB + ')' }}>
                  {popupContent.description && (<p className="popup-desc" dangerouslySetInnerHTML={{ __html: popupContent.description }} />)}
                  {popupContent.activities && (
                      <div className="popup-activities">
                          <div className="popup-ctext"><b>Aktivitäten:</b><br />{popupContent.activities.join(', ')}</div>
                      </div>
                  )}
                  {(popupContent.email || popupContent.website) && (
                    <div className="popup-contact">
                      <div className="popup-mail">
                          <div className="popup-icon"><Icons title={ popupContent.email } type="mail" /></div>
                          <div className="popup-ctext">{popupContent.email}</div>
                      </div>
                      <div className="popup-website">
                          <div className="popup-icon"><Icons title={ popupContent.website } type="link" /></div>
                          <div className="popup-ctext">
                              <a href={popupContent.website} target="_blank">{popupContent.website}</a>
                          </div>
                      </div>
                    </div>
                  )}
                  {(popupContent.url) && (
                    <div className="popup-url">
                      <span>
                        <a href={popupContent.url} target="_top">DIMB Website</a>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
}

export default MapComponent;
