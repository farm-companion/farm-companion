# Google Maps Setup Guide

## Map ID Configuration

The application uses Google Maps Advanced Markers which require a valid Map ID. 

### Required Setup

1. **Create Map ID in Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Map ID"
   - Name: `farm-companion-map` (or use existing: `f907b7cb594ed2caa752543d`)
   - Map Type: `Vector`
   - Click "Create"

2. **Configure Map Styling**:
   Since we're using a Map ID, map styles must be configured through the Google Cloud Console:
   - Go to [Google Cloud Console Maps](https://console.cloud.google.com/google/maps-apis)
   - Select your project
   - Go to "Map Management" > "Map Styles"
   - Create a new style or modify existing
   - Apply these settings:
     ```json
     {
       "featureType": "poi",
       "elementType": "labels",
       "stylers": [{ "visibility": "off" }]
     },
     {
       "featureType": "transit",
       "elementType": "labels", 
       "stylers": [{ "visibility": "off" }]
     },
     {
       "featureType": "landscape",
       "elementType": "geometry",
       "stylers": [{ "color": "#f5f5f2" }]
     },
     {
       "featureType": "water",
       "elementType": "geometry",
       "stylers": [{ "color": "#c9d2e0" }]
     }
     ```

3. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### Alternative: Inline Styling (Not Recommended)

If you prefer inline styling, you can remove the `mapId` and use inline styles, but this will prevent Advanced Markers from working:

```tsx
<Map
  center={mapCenter}
  zoom={mapZoom}
  // Remove mapId="farm-companion-map"
  styles={[
    // Your custom styles here
  ]}
>
```

### Benefits of Map ID + Advanced Markers

- ✅ **Better Performance**: Advanced Markers are more efficient
- ✅ **Future-proof**: Uses latest Google Maps API
- ✅ **Enhanced Features**: Better accessibility and interactions
- ✅ **Cloud-based Styling**: Centralized style management
- ✅ **No Deprecation Warnings**: Clean console output

### Current Configuration

The application is configured to use:
 - **Map ID**: `f907b7cb594ed2caa752543d`
- **Advanced Markers**: For farm locations and user location
- **Custom Styling**: Applied through Google Cloud Console
- **High Contrast Markers**: Dark green with white borders for visibility
