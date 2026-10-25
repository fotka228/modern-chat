import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSendVideo: (videoUri: string, duration: number) => Promise<void>;
};

const MAX_SEC = 60;
const SIZE = 272;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export function VideoNoteRecorder({ visible, onClose, onSendVideo }: Props) {
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>("front");
  const [isRecording, setIsRecording] = useState(false);
  const [sec, setSec] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secRef = useRef(0);
  const recordingRef = useRef(false);

  const [camPerm, reqCam] = useCameraPermissions();
  const [micPerm, reqMic] = useMicrophonePermissions();

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const handleStop = () => {
    clearTimer();
    if (cameraRef.current && recordingRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const handleClose = () => {
    clearTimer();
    recordingRef.current = false;
    secRef.current = 0;
    setSec(0);
    setIsRecording(false);
    setIsProcessing(false);
    onClose();
  };

  const handleStart = async () => {
    if (!camPerm?.granted && !(await reqCam()).granted) return Alert.alert("Помилка", "Дозвольте камеру");
    if (!micPerm?.granted && !(await reqMic()).granted) return Alert.alert("Помилка", "Дозвольте мікрофон");
    if (!cameraRef.current || recordingRef.current) return;

    try {
      recordingRef.current = true;
      secRef.current = 0;
      setSec(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        secRef.current += 1;
        setSec(secRef.current);
        if (secRef.current >= MAX_SEC) handleStop();
      }, 1000);

      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_SEC });

      clearTimer();
      recordingRef.current = false;
      setIsRecording(false);

      if (video?.uri) {
        setIsProcessing(true);
        await onSendVideo(video.uri, Math.max(secRef.current, 1));
        handleClose();
      }
    } catch (err) {
      console.error(err);
      clearTimer();
      recordingRef.current = false;
      setIsRecording(false);
      setIsProcessing(false);
      Alert.alert("Помилка", "Не вдалося записати або надіслати відео");
    }
  };

  const progress = Math.min(1, sec / MAX_SEC);
  const ringColor = isRecording ? "#ff453a" : "#0a84ff";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <View className="flex-1 bg-black/95 justify-center items-center">
        <TouchableOpacity
          onPress={handleClose}
          disabled={isRecording || isProcessing}
          activeOpacity={0.8}
          hitSlop={8}
          className="absolute right-4 w-11 h-11 rounded-full bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center"
          style={{ top: Math.max(insets.top, 16) + 8, opacity: isRecording || isProcessing ? 0.4 : 1 }}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Таймер */}
        <View className="flex-row items-center bg-[#1c1c1e] border border-[#2a2a2c] rounded-full px-4 py-2 mb-6">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2.5"
            style={{ backgroundColor: isRecording ? "#ff453a" : "#636366" }}
          />
          <Text className="text-white text-base font-semibold">
            {fmt(sec)} <Text className="text-neutral-500 font-normal">/ {fmt(MAX_SEC)}</Text>
          </Text>
        </View>

        {/* Камера в колі з кільцем прогресу */}
        <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
          <View
            style={{ width: SIZE - 16, height: SIZE - 16, borderRadius: (SIZE - 16) / 2 }}
            className="overflow-hidden bg-[#1c1c1e] justify-center items-center"
          >
            <CameraView ref={cameraRef} style={{ width: "100%", height: "100%" }} facing={facing} mode="video" />
            {isProcessing && (
              <View className="absolute inset-0 bg-black/70 justify-center items-center">
                <ActivityIndicator size="large" color="#0a84ff" />
                <Text className="text-white text-sm mt-3">Надсилання...</Text>
              </View>
            )}
          </View>

          <Svg width={SIZE} height={SIZE} style={{ position: "absolute" }} pointerEvents="none">
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="#2a2a2c"
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={ringColor}
              strokeWidth={STROKE}
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (isRecording ? progress : 0) * CIRC}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
        </View>

        <Text className="text-neutral-500 text-sm mt-6 h-5">
          {isProcessing ? "" : isRecording ? "Натисніть, щоб зупинити й надіслати" : "Натисніть, щоб почати запис"}
        </Text>

        {/* Кнопки */}
        <View className="flex-row items-center justify-center mt-6" style={{ gap: 36 }}>
          <TouchableOpacity
            onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
            disabled={isRecording || isProcessing}
            activeOpacity={0.8}
            className="w-12 h-12 rounded-full bg-[#1c1c1e] border border-[#2a2a2c] items-center justify-center"
            style={{ opacity: isRecording || isProcessing ? 0.4 : 1 }}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isRecording ? handleStop : handleStart}
            disabled={isProcessing}
            activeOpacity={0.85}
            className="w-20 h-20 rounded-full items-center justify-center border-4 border-white"
          >
            <View
              style={{
                width: isRecording ? 28 : 56,
                height: isRecording ? 28 : 56,
                borderRadius: isRecording ? 8 : 28,
                backgroundColor: isRecording ? "#ff453a" : "#ff453a",
              }}
            />
          </TouchableOpacity>

          {/* Порожній блок для симетрії */}
          <View className="w-12 h-12" />
        </View>
      </View>
    </Modal>
  );
}