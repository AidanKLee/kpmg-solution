import L from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableList, faMagnifyingGlassPlus, faMagnifyingGlassMinus } from '@fortawesome/free-solid-svg-icons';
import { Icon } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';

const Map = props => {

    const { 
        companies,
        handleToggleMenu,
        leafletRef,
        mapRef
    } = useMemo(() => props, [props]);

    return (
        <div id="map" ref={ mapRef }>
            <MapContainer
                center={[51.505, -0.09]}
                maxBounds={[[-90, -180], [90, 180]]}
                maxBoundsViscosity={1}
                minZoom={2}
                zoom={3} 
                zoomControl={false}
                >
                <Controls handleToggleMenu={ handleToggleMenu }/>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Companies data={ companies } handleToggleMenu={ handleToggleMenu } leafletRef={ leafletRef } />
            </MapContainer>
        </div>
    )

}

const Companies = props => {

    const { data, handleToggleMenu, leafletRef } = props;

    const [ currentLayers, setcurrentLayers ] = useState([]);

    const map = useMap();
    leafletRef.current = map;

    const timeoutRef = useRef(null);

    useEffect(() => {

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
        
            if (currentLayers.length > 0) {
                currentLayers.forEach(layer => {
                    map.removeLayer(layer);
                });
            } 

            const markers = L.markerClusterGroup();

            data.forEach(company => {
                
                const { latitude: lat, longitude: lng } = company.location;
                
                const { id } = company;

                const marker = L.marker([lat, lng], {
                    icon: new Icon({ iconUrl: markerIconPng,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]}),
                    interactive: true
                });

                marker.addEventListener('click', e => {
                    const menu = document.getElementById('menu');
                    const tableRows = document.querySelectorAll('.company-data');
                    const tableElement = document.getElementById(id);

                    tableRows.forEach(row => row.classList.remove('selected'));

                    tableElement.classList.add('selected');

                    if (!menu.classList.contains('open')) {
                        handleToggleMenu();
                    }

                    menu.scrollTo({
                        top: tableElement.offsetTop - 32,
                        left: 0,
                        behaviour: 'smooth'
                    })
                });
            
                markers.addLayer(marker);

                setcurrentLayers([...currentLayers, markers])
            })

            map.addLayer(markers);

        }, 1000)
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, handleToggleMenu, map])

}

const Controls = props => {

    const map = useMap();

    const { handleToggleMenu } = useMemo(() => props, [props]);
    
    return (
        <div id="controls">

          <Button 
            className='p-2 rounded-pill btn-light border' variant="primary"
            onClick={() => map.zoomIn()}
            >
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
          </Button>

          <Button
            className='p-2 rounded-pill btn-light border' variant="primary"
            onClick={() => map.zoomOut()}
            >
            <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
          </Button>

          <Button
            className='p-2 rounded-pill border' variant="primary"
            onClick={() => handleToggleMenu()}
            >
            <FontAwesomeIcon icon={faTableList} />
          </Button>

        </div>
    )
}

export default Map;