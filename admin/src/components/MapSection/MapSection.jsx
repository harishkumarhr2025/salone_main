// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Fix default marker icons
// const DefaultIcon = L.icon({
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// const MapSection = () => {
//   const position = [12.9716, 77.5946]; // Your coordinates [lat, lng]

//   return (
//     <div style={{ height: '400px', width: '100%', borderRadius: '16px' }}>
//       <MapContainer
//         center={position}
//         zoom={13}
//         style={{ height: '100%', width: '100%', borderRadius: '16px' }}
//       >
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <Marker position={position}>
//           <Popup>Your Location</Popup>
//         </Marker>
//       </MapContainer>
//     </div>
//   );
// };

// export default MapSection;

// // Add at the top with other imports
// import { Box, Button, CircularProgress, Typography } from '@mui/material';
// import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
// import { LocationOn } from '@mui/icons-material';

// // Add this component in your Home page
// const MapSection = () => {
//   const mapStyles = {
//     height: 400,
//     width: '100%',
//     borderRadius: '16px',
//     border: '2px solid #7c4dff',
//   };

//   const defaultCenter = {
//     lat: 12.9716, // Replace with your latitude
//     lng: 77.5946, // Replace with your longitude
//   };

//   return (
//     <Box p={5}>
//       <LoadScript
//         googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
//         loadingElement={
//           <Box
//             sx={{
//               height: 400,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <CircularProgress />
//           </Box>
//         }
//         region="IN"
//         language="en"
//       >
//         <GoogleMap
//           mapContainerStyle={mapStyles}
//           zoom={15}
//           center={defaultCenter}
//           options={{
//             streetViewControl: false,
//             mapTypeControl: false,
//             styles: [
//               {
//                 featureType: 'poi',
//                 elementType: 'labels',
//                 stylers: [{ visibility: 'off' }],
//               },
//             ],
//           }}
//         >
//           <Marker position={defaultCenter} />
//         </GoogleMap>
//       </LoadScript>

//       <Box sx={{ mt: 4, textAlign: 'center' }}>
//         <Button
//           fullWidth
//           aria-label="Get directions to our location"
//           variant="contained"
//           size="large"
//           href={`https://www.google.com/maps/dir/?api=1&destination=${defaultCenter.lat},${defaultCenter.lng}`}
//           target="_blank"
//           rel="noopener"
//           startIcon={<LocationOn />}
//           sx={{
//             borderRadius: 4,
//             py: 2,
//             textTransform: 'none',
//             fontSize: '1.1rem',
//             maxWidth: 400,
//             mx: 'auto',
//           }}
//         >
//           Get Directions
//         </Button>
//       </Box>
//     </Box>
//   );
// };

// export default MapSection;
