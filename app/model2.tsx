import { useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  Model,
  useCameraManipulator,
} from "react-native-filament";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import ShadedModel from "../base_basic_shaded.glb";

// Inner component that uses the Filament hook - must be inside FilamentScene
function InteractiveScene({ viewHeight }: { viewHeight: number }) {
  const currentDistance = useRef(8);
  const lastScale = useRef(1);

  // Initialize camera manipulator for zoom, pan, and rotation - must be called inside FilamentScene context
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: [0, 0, currentDistance.current], // Initial camera position (z = distance from model)
    targetPosition: [0, 0, 0],    // Point the camera is looking at (model center)
    orbitSpeed: [0.003, 0.003],   // Speed of orbiting (rotation)
  });

  // Pan gesture for rotation/orbit around the model
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      const yCorrected = viewHeight - event.y;
      cameraManipulator?.grabBegin(event.x, yCorrected, false);
    })
    .onUpdate((event) => {
      const yCorrected = viewHeight - event.y;
      cameraManipulator?.grabUpdate(event.x, yCorrected);
    })
    .onEnd(() => {
      cameraManipulator?.grabEnd();
    });

  // Pinch gesture for zoom in/out - using grabBegin with zoom flag
  const pinchGesture = Gesture.Pinch()
    .onBegin((event) => {
      const yCorrected = viewHeight - event.focalY;
      // Use grabBegin with zoom enabled (third parameter = true for zoom)
      cameraManipulator?.grabBegin(event.focalX, yCorrected, true);
      lastScale.current = event.scale;
    })
    .onUpdate((event) => {
      const yCorrected = viewHeight - event.focalY;
      // Calculate scale change from initial pinch
      const scaleChange = event.scale - lastScale.current;
      lastScale.current = event.scale;
      // Move camera: negative Y movement = zoom in, positive = zoom out
      // Increased sensitivity for better zoom control
      const zoomMovement = -scaleChange * 200;
      cameraManipulator?.grabUpdate(event.focalX, yCorrected + zoomMovement);
    })
    .onEnd(() => {
      cameraManipulator?.grabEnd();
      lastScale.current = 1;
    });

  // Combine gestures to work simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <FilamentView style={styles.filamentView}>
        {/* 💡 A light source, otherwise the scene will be black */}
        <DefaultLight />

        {/* 📦 A 3D model */}
        <Model source={ShadedModel} />

        {/* 📹 A camera with manipulator for interactive controls */}
        <Camera cameraManipulator={cameraManipulator} />
      </FilamentView>
    </GestureDetector>
  );
}

export default function Model2Screen() {
  const router = useRouter();
  const { height: viewHeight } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shaded Model</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.scene}>
        <FilamentScene>
          <InteractiveScene viewHeight={viewHeight} />
        </FilamentScene>
      </View>

      <View style={styles.controlsHint}>
        <Text style={styles.hintText}>👆 Drag to rotate • 🔍 Pinch to zoom</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 60,
  },
  scene: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
  controlsHint: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hintText: {
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
});
