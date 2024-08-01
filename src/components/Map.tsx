import React, { useEffect, useState } from 'react';
import { Map, View, Feature } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Select, defaults as defaultInteractions } from 'ol/interaction';
import "ol/ol.css";
import Icons from './Icons';
import MapStyles from './MapStyles';
import GeolocationControl from './GeolocationControl';
import SearchControl from './SearchControl';


interface Result {
    settings: any;
    url: string;
    controls: string[];
    label: boolean;
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

function MapComponent( { settings, url, controls, label }: Result ) {
    const [ popupContent, setPopupContent ] = useState<PopupContent>({});

    useEffect(() => {
      const { labelStyle, polygonStyle, selectStyle, locationStyle } = MapStyles;
      polygonStyle.getFill().setColor('rgba(' + settings.style.featFillRGB + ', ' + settings.style.featFillAlpha + ')');
      polygonStyle.getStroke().setColor('rgb(' + settings.style.featStrokeRGB + ')');
      polygonStyle.getStroke().setWidth(settings.style.featStrokeWidth);
      const style = label ? [polygonStyle, labelStyle] : [polygonStyle];
  
      const source = new VectorSource({
        format: new GeoJSON,
        url,
      });
      
      const vectorLayer = new VectorLayer({
        source,
        style: function (feature) {
          const label = feature.get('name').split(' ').join('\n');
          labelStyle.getText().setText(label);
          return style;
        },
      });
  
      const selectInteraction = new Select({
        style: selectStyle,
      });
  
      const locationFeature = new Feature();
      locationFeature.setStyle(locationStyle);
  
      const map = new Map({
        target: 'map',
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
        interactions: defaultInteractions().extend([selectInteraction]),
      });
  
      source.once('change', () => {
        if (source.getState() === 'ready') {
          const extent = source.getExtent();
  
          if (!extent || extent[0] === Infinity) {
            return;
          }
          map.getView().fit(extent, { padding: [50, 50, 50, 50] });
          source.addFeature(locationFeature);
        }
      });
  
      map.on('click', (event: any): void => {
        const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
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
      });
  
      if (controls.includes('locate')) {
        map.addControl(new GeolocationControl(locationFeature));
      }
  
      if (controls.includes('search')) {
        map.addControl(new SearchControl(locationFeature, settings.paths));
      }
    
      return () => {
        map.setTarget('');
      };
    }, [url, controls, label, settings]);

    return (
      <div className={ "map-container" + ( settings.addClasses === '' ? '' : ' ' + settings.addClasses ) }>
        <div id="map" style={{ height: settings.height + 'px' }} />
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
