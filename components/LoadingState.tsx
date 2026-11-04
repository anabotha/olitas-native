import { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View } from "react-native";
import { Card } from "./ui";
import { useTheme } from "@/lib/theme";

function Skeleton({ w, h, r = 6 }: { w: DimensionValue; h: number; r?: number }) {
  const c = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.muted, opacity }} />;
}

export function LoadingState() {
  return (
    <View style={styles.col}>
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <View style={styles.row}>
            <Skeleton w={40} h={40} r={10} />
            <View style={{ gap: 8 }}>
              <Skeleton w={80} h={14} />
              <Skeleton w={128} h={12} />
            </View>
          </View>
          <View style={styles.row}>
            <Skeleton w={96} h={20} />
            <Skeleton w={112} h={20} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 16 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
});
