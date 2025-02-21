import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TextInput,
  Alert,
  Button,
} from "react-native";
import MapView, {
  Circle,
  MapPressEvent,
  Region,
  Marker,
} from "react-native-maps";
import * as Location from "expo-location";
import { isPointWithinRadius } from "geolib";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { sendPushNotification } from "./onsesignal";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function App(): JSX.Element {
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
  const [marker, setMarker] = useState<Coordinates>({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [radius, setRadius] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access location was denied");
      setLoading(false);
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setRegion((prev) => ({ ...prev, latitude, longitude }));
    setGeofenceCenter({ latitude, longitude });
    setLoading(false);
  };

  useEffect(() => {
    fetchLocation();
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize(`${process.env.EXPO_PUBLIC_APP_ID}`);

    OneSignal.Notifications.requestPermission(true);
  }, []);

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    const isInside = isPointWithinRadius(
      { latitude, longitude },
      geofenceCenter,
      radius
    );

    const message = isInside ? "Inside geofence" : "Outside geofence";
    await sendPushNotification(isInside);
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
        <Circle
          center={geofenceCenter}
          radius={radius}
          strokeColor="rgba(0,0,255,0.5)"
          fillColor="rgba(0,0,255,0.2)"
        />
        <Marker coordinate={marker} title="Geofence Center" />
      </MapView>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter radius in meters"
        onChangeText={(text) => setRadius(Number(text))}
        value={String(radius)}
      />
      <Button
        title={loading ? "Refreshing..." : "Refresh Location"}
        onPress={fetchLocation}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    height: 500,
    ...StyleSheet.absoluteFillObject,
  },
  input: {
    position: "absolute",
    top: 50,
    width: Dimensions.get("window").width * 0.8,
    height: 40,
    backgroundColor: "white",
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
