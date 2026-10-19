import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSendVideo: (videoUri: string, duration: number) => Promise<void>;
};

export function VideoNoteRecorder({ visible, onClose, onSendVideo }: Props) {
  const [facing, setFacing] = useState<CameraType>("front");
  const [isRecording, setIsRecording] = useState(false);
  const [sec, setSec] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const timerRef = useRef<any>(null);

  const [camPerm, reqCam] = useCameraPermissions();
  const [micPerm, reqMic] = useMicrophonePermissions();

  const handleStart = async () => {
    if (!camPerm?.granted && !(await reqCam()).granted) return Alert.alert("Помилка", "Дозвольте камеру");
    if (!micPerm?.granted && !(await reqMic()).granted) return Alert.alert("Помилка", "Дозвольте мікрофон");
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setSec(0);

      timerRef.current = setInterval(() => {
        setSec((prev) => (prev >= 59 ? (handleStop(), 60) : prev + 1));
      }, 1000);

      const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (video?.uri) {
        setIsProcessing(true);
        await onSendVideo(video.uri, sec || 1);
        setIsProcessing(false);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/90 justify-center items-center">
        <TouchableOpacity onPress={handleClose} disabled={isRecording} className="absolute top-12 right-6 p-2">
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <Text className="text-white font-mono text-base mb-4">{sec} / 60s</Text>

        <View className="w-64 h-64 rounded-full overflow-hidden border-4 border-blue-600 bg-slate-900 justify-center items-center">
          <CameraView ref={cameraRef} style={{ width: "100%", height: "100%" }} facing={facing} mode="video" />
          {isProcessing && (
            <View className="absolute inset-0 bg-black/70 justify-center items-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-8 mt-8">
          <TouchableOpacity onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))} className="p-3 bg-white/10 rounded-full">
            <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={isRecording ? handleStop : handleStart} className={`w-16 h-16 rounded-full items-center justify-center ${isRecording ? "bg-red-500" : "bg-blue-600"}`}>
            <Ionicons name={isRecording ? "stop" : "radio-button-on"} size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}