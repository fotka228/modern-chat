// components/ImageViewerModal.tsx
import {
  Modal,
  View,
  Image,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

export function ImageViewerModal({ visible, imageUrl, onClose }: Props) {
  const { width, height } = useWindowDimensions();

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
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: Math.min(width * 0.92, 720),
            height: height * 0.75,
            borderRadius: 16,
          }}
          resizeMode="contain"
        />
      </Pressable>

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(0,0,0,0.6)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={26} color="#fff" />
      </TouchableOpacity>
    </Modal>
  );
}