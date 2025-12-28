import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

interface IntroScreenProps {
  onFinish: () => void;
}

export default function IntroScreen({ onFinish }: IntroScreenProps) {
  const [showSkip, setShowSkip] = useState(false);
  
  const player = useVideoPlayer(require('@/assets/videos/intro.mp4'), (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 500);

    const autoAdvance = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoAdvance);
    };
  }, [onFinish]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      onFinish();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
      
      {showSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={onFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: width,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
