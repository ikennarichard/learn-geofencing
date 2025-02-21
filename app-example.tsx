import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TextInput, Alert } from 'react-native';
import MapView, { Circle, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { isPointWithinRadius } from 'geolib';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const LOCATION_TASK_NAME = 'background-location-task';

// Define a background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    console.log('Background location update:', locations);
    // Additional geofence monitoring can be implemented here.
  }
});

export default function App(): JSX.Element {
  // Set up state with type annotations
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [geofenceCenter, setGeofenceCenter] = useState<Coordinates>({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [radius, setRadius] = useState<number>(1000);

  useEffect(() => {
    (async () => {
      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      // Request notification permissions
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      if (notifStatus !== 'granted') {
        alert('Notification permissions not granted');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({ ...region, latitude, longitude });
      setGeofenceCenter({ latitude, longitude });

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 10,
      });
    })();
  }, []);

  // Handler for map press events
  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    // Check if the tapped point is within the geofence radius
    const isInside = isPointWithinRadius(
      { latitude, longitude },
      geofenceCenter,
      radius
    );

    const message = isInside ? 'Inside geofence' : 'Outside geofence';

    // Send a local push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Geofence Alert',
        body: message,
      },
      trigger: null,
    });

    // Optionally display an alert
    Alert.alert(message);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        onRegionChangeComplete={(region: Region) => setRegion(region)}
      >
        {/* Render the geofence circle */}
        <Circle
          center={geofenceCenter}
          radius={radius}
          strokeColor="rgba(0,0,255,0.5)"
          fillColor="rgba(0,0,255,0.2)"
        />
      </MapView>
      {/* Input for adjusting the geofence radius */}
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter radius in meters"
        onChangeText={(text) => setRadius(Number(text))}
        value={String(radius)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  input: {
    position: 'absolute',
    top: 50,
    width: Dimensions.get('window').width * 0.8,
    height: 40,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
