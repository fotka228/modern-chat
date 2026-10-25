import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

export function ImageViewerModal({ visible, imageUrl, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) setLoading(true);
  }, [visible, imageUrl]);

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.94)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: Math.min(width, 900),
            height: height * 0.8,
          }}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color="#0a84ff" />
          </View>
        )}
      </Pressable>

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        hitSlop={8}
        style={{
          position: "absolute",
          top: Math.max(insets.top, 16) + 8,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(44,44,46,0.85)",
          borderWidth: 1,
          borderColor: "#3a3a3c",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </Modal>
  );
}