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
import LoadSpinner from './LoadSpinner';


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
    extent?: string;
}

function MapComponent( { settings, url, controls, label }: Result ) {
    const [ popupContent, setPopupContent ] = useState<PopupContent>({});
    const [ isFetching, setIsFetching ] = useState(false);
    const metaDataUrl: string = settings.paths.metaDataURL as string;

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
  
      map.on('click', async (event: any): Promise<void> => {
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
              'site-url': website,
              'data-extent': extent  
            } = properties;
            const popupContent = {
              name,
              url,
              description,
              logo: logo?.thumb || logo || '',
              activities,
              email,
              website,
              extent
            }
            setPopupContent(popupContent);
            
            setIsFetching(true);
            
            const response = await fetch(
              `${metaDataUrl}/${name}`
            );
            const data = await response.json();           

            if (data) {
              const { 
                area: {
                  name,
                  url,
                  activities, 
                  'logo-url': logo, 
                  contact: email, 
                  description, 
                  'site-url': website,
                  'data-extent': extent
                }
              } = data;
              const popupContent = {
                name,
                url,
                description,
                logo: logo?.thumb || logo || '',
                activities,
                email,
                website,
                extent
              }
              console.log( 'extent:', popupContent );
              setIsFetching(false);
              setPopupContent(popupContent);
            }

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
                        <img src={ popupContent.logo.replace("http://", "https://") } alt={popupContent.name} />
                      </div>
                    )}
                    <div className="popup-name">
                        <h2 style={{ color: 'rgb(' + settings.style.headlineRGB + ')' }}>{popupContent.name}</h2>
                    </div>
                </div>
                { isFetching && <LoadSpinner display='Lade Daten' /> }
                { popupContent.extent === "full" ?
                  <div className="popup-content" style={{ color: 'rgb(' + settings.style.textRGB + ')' }}>
                      {popupContent.description && (
                        <div className="popup-description">
                          <b>Beschreibung:</b><br />
                          <span className="popup-desc" dangerouslySetInnerHTML={{ __html: popupContent.description }} />
                        </div>
                      )}
                      {popupContent.activities && (
                          <div className="popup-activities">
                              <div className="popup-ctext"><b>Aktivitäten:</b><br />
                              { popupContent.activities[0] !== '' ? popupContent.activities.join(', ') : <i>Keine Aktivitäten angegeben.</i> }
                              </div>
                          </div>
                      )}
                      {(popupContent.email || popupContent.website) && (
                        <div className="popup-contact">
                          { popupContent.email &&
                              <div className="popup-mail">
                                  <div className="popup-icon"><Icons title={ popupContent.email } type="mail" /></div>
                                  <div className="popup-ctext">
                                      <a href={'mailto:' + popupContent.email}>{popupContent.email}</a>
                                  </div>
                              </div>
                          }
                          { popupContent.website &&
                              <div className="popup-website">
                                  <div className="popup-icon"><Icons title={ popupContent.website } type="link" /></div>
                                  <div className="popup-ctext">
                                      <a href={popupContent.website} target="_blank">{popupContent.website}</a>
                                  </div>
                              </div>
                          }
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
                  :
                  <div className="popup-content" style={{ color: 'rgb(' + settings.style.textRGB + ')' }}>
                    <i>Keine weiteren Informationen zur IG verfügbar.</i>
                  </div>
                }
            </div>
          )}
        </div>
      </div>
    );
}

export default MapComponent;
