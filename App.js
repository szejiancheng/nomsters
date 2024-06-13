import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Button, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Importing assets
const petGif = require('./assets/pets/frogbro.gif');
const backgroundImage = require('./assets/backgrounds/beach.png');
const bearClubImage = require('./assets/backgrounds/bearclub.png');
const storeBackgroundImage = require('./assets/backgrounds/storebg.png');
const heartIcon = require('./assets/icons/heart.png');
const storeIcon = require('./assets/icons/store.png');
const closeButtonIcon = require('./assets/icons/closebutton.png');
const lockIcon = require('./assets/icons/lock.png');
const musicIcon = require('./assets/icons/music.png');
const musicMuteIcon = require('./assets/icons/musicmute.png');
const soundIcon = require('./assets/icons/sound.png');
const soundMuteIcon = require('./assets/icons/soundmute.png');
const beachMusic = require('./assets/music/beach.wav');
const bearClubMusic = require('./assets/music/bearclub.wav');
const backgrounds = [backgroundImage];

export default function App() {
  // State management
  const [petHealth, setPetHealth] = useState(100);
  const healthBarWidth = useRef(new Animated.Value(100)).current;
  const [storeFadeAnim] = useState(new Animated.Value(1));
  const [showNewScreen, setShowNewScreen] = useState(false);
  const [showCameraScreen, setShowCameraScreen] = useState(false);
  const [goldCoins, setGoldCoins] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [backgroundFadeAnim] = useState(new Animated.Value(1));
  const [isBearClubUnlocked, setIsBearClubUnlocked] = useState(false);
  const [sound, setSound] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFadeAnim] = useState(new Animated.Value(1));

  // Health decrease logic
  useEffect(() => {
    const interval = setInterval(() => {
      const newHealth = Math.min(Math.max(petHealth - 5, 0), 100);
      setPetHealth(newHealth);
      animateHealthBar(newHealth);
    }, 2000);

    return () => clearInterval(interval);
  }, [petHealth]);

  // Play background music on background change
  useEffect(() => {
    playBackgroundMusic();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [backgroundIndex]);

  // Feed pet handler
  const handleFeedPet = () => {
    const newHealth = Math.min(Math.max(petHealth + 10, 0), 100);
    setPetHealth(newHealth);
    setGoldCoins(goldCoins + 10);
    animateHealthBar(newHealth);
    Animated.timing(cameraFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    setShowCameraScreen(true);
  };

  // Menu visibility toggle
  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  // Toggle music
  const toggleMusic = async () => {
    setMusicEnabled(!musicEnabled);
    if (sound) {
      if (musicEnabled) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Animate health bar
  const animateHealthBar = (health) => {
    Animated.timing(healthBarWidth, {
      toValue: health,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  // Open store animation
  const openStore = () => {
    Animated.timing(storeFadeAnim, {
      toValue: 0,
      duration: 10,
      useNativeDriver: true,
    }).start(() => {
      setShowNewScreen(true);
      Animated.timing(storeFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  // Close store animation
  const closeStore = () => {
    Animated.timing(storeFadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowNewScreen(false);
      Animated.timing(backgroundFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    });
  };

  // Close camera animation
  const closeCamera = () => {
    Animated.timing(cameraFadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowCameraScreen(false);
      Animated.timing(cameraFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  // Health message based on pet health
  const getHealthMessage = () => {
    if (petHealth < 30) {
      return 'Frogbro is hungry! Feed me!';
    } else if (petHealth < 70) {
      return 'Frogbro is a little hungry :>';
    } else {
      return 'Frogbro is full and loves you <3';
    }
  };

  // Handle gesture for background change
  const handleGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 50) {
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            if (prevIndex === 1 && !isBearClubUnlocked) {
              return 0;
            }
            return (prevIndex - 1 + backgrounds.length) % backgrounds.length;
          });
          Animated.timing(backgroundFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } else if (nativeEvent.translationX < -50) {
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            if (prevIndex === 0 && !isBearClubUnlocked) {
              return 0;
            }
            return (prevIndex + 1) % backgrounds.length;
          });
          Animated.timing(backgroundFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }
    }
  };

  // Unlock bear club feature
  const unlockBearClub = () => {
    if (goldCoins >= 100) {
      setGoldCoins(goldCoins - 100);
      setIsBearClubUnlocked(true);
      backgrounds.push(bearClubImage);
    }
  };

  // Play background music based on background index
  const playBackgroundMusic = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        backgroundIndex === 0 ? beachMusic : bearClubMusic
      );

      setSound(newSound);

      await newSound.setIsLoopingAsync(true);
      if (musicEnabled) {
        await newSound.playAsync();
      }
    } catch (error) {
      console.error("Error loading or playing sound:", error);
    }
  };

  // Handle camera permissions
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  // Toggle camera facing
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Main screen rendering
  const renderMainScreen = () => (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <Animated.View style={styles.container}>
          <Animated.View style={{ ...styles.backgroundContainer, opacity: backgroundFadeAnim }}>
            <ExpoImage source={backgrounds[backgroundIndex]} style={styles.background} />
          </Animated.View>
          <TouchableOpacity style={styles.storeButton} onPress={openStore}>
            <ExpoImage source={storeIcon} style={styles.storeIcon} />
          </TouchableOpacity>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{getHealthMessage()}</Text>
          </View>
          <View style={styles.healthBarContainer}>
            <ExpoImage source={heartIcon} style={styles.heartIcon} />
            <View style={styles.healthBarBackground}>
              <Animated.View style={[styles.healthBar, { width: animatedWidth, backgroundColor: animatedColor }]}>
                <Text style={styles.healthText}>{petHealth}</Text>
              </Animated.View>
            </View>
          </View>
          <View style={styles.goldContainer}>
            <Text style={styles.goldText}>{goldCoins} Gold</Text>
          </View>
          <View style={styles.content}>
            <ExpoImage source={petGif} style={styles.pet} />
            <TouchableOpacity style={styles.button} onPress={handleFeedPet}>
              <Text style={styles.buttonText}>FEED</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
              <Text style={styles.buttonText}>menu</Text>
            </TouchableOpacity>
          </View>
          <StatusBar style="auto" />
        </Animated.View>
      </PanGestureHandler>
      {menuVisible && (
        <View style={styles.menuContainer}>
          <TouchableOpacity onPress={toggleMusic}>
            <ExpoImage source={musicEnabled ? musicIcon : musicMuteIcon} style={styles.menuIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSound}>
            <ExpoImage source={soundEnabled ? soundIcon : soundMuteIcon} style={styles.menuIcon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Store screen rendering
  const renderStoreScreen = () => (
    <Animated.View style={[styles.newScreenContainer, { opacity: storeFadeAnim }]}>
      <ExpoImage source={storeBackgroundImage} style={styles.newBackground} />
      <TouchableOpacity style={styles.closeButton} onPress={closeStore}>
        <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
      </TouchableOpacity>
      <View style={styles.headerContainer}>
        <Text style={styles.newScreenText}>Welcome to the Store!</Text>
      </View>
      <View style={styles.storeGoldContainer}>
        <Text style={styles.goldText}>{goldCoins} Gold</Text>
      </View>
      <View style={styles.storeItemsContainer}>
        <View style={styles.storeItem}>
          <Text style={styles.storeItemName}>Bear Club</Text>
          <TouchableOpacity style={styles.itemContainer} onPress={unlockBearClub} disabled={isBearClubUnlocked || goldCoins < 100}>
            <ExpoImage
              source={bearClubImage}
              style={isBearClubUnlocked ? styles.bearClubImage : styles.greyedBearClubImage}
            />
            {!isBearClubUnlocked && (
              <TouchableOpacity style={styles.lockIconContainer} onPress={unlockBearClub}>
                <ExpoImage source={lockIcon} style={styles.lockIcon} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          <Text style={styles.storeItemPrice}>
            {isBearClubUnlocked ? 'Purchased!' : '100 Gold'}
          </Text>
        </View>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.storeItem}>
            <Text style={styles.storeItemName}></Text>
            <View style={styles.itemContainer}></View>
            <Text style={styles.storeItemPrice}></Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  // Camera screen rendering
  const renderCameraScreen = () => (
    <Animated.View style={[styles.cameraContainer, { opacity: cameraFadeAnim }]}>
      <CameraView style={styles.cameraView} facing={facing}>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={closeCamera}>
          <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
        </TouchableOpacity>
      </CameraView>
    </Animated.View>
  );

  const animatedWidth = healthBarWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const animatedColor = healthBarWidth.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['red', 'orange', 'green'],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1 }}>
        {showCameraScreen ? renderCameraScreen() : (showNewScreen ? renderStoreScreen() : renderMainScreen())}
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  storeButton: {
    position: 'absolute',
    top: 115,
    left: 20,
    zIndex: 1,
  },
  storeIcon: {
    width: 65,
    height: 65,
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  healthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -15,
    marginHorizontal: 20,
  },
  heartIcon: {
    width: 50,
    height: 50,
    marginRight: 5,
  },
  healthBarBackground: {
    flex: 1,
    height: 32,
    backgroundColor: '#ddd',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  healthBar: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthText: {
    position: 'absolute',
    left: '50%',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  goldContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  storeGoldContainer: {
    position: 'absolute',
    top: 115,
    alignSelf: 'center',
  },
  goldText: {
    fontSize: 35,
    color: 'gold',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 100,
  },
  pet: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
    width: 150,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  menuButton: {
    position: 'absolute',
    top: -50,
    right: 20,
    width: 100,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 200,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 150,
    zIndex: 10,
  },
  flipButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 70,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButtonContainer: {
    position: 'absolute',
    top: 200,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 150,
    zIndex: 10,
  },
  menuIcon: {
    width: 40,
    height: 40,
  },
  newScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  newScreenText: {
    fontSize: 24,
    color: '#fff',
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  closeButtonIcon: {
    width: 70,
    height: 70,
  },
  storeItemsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 250,
  },
  storeItem: {
    width: '40%',
    height: '20%',
    margin: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  storeItemName: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  storeItemPrice: {
    fontSize: 18,
    color: 'gold',
    marginTop: 5,
  },
  lockIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  lockIcon: {
    width: 50,
    height: 50,
  },
  bearClubImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  greyedBearClubImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    opacity: 0.5,
  },
  itemContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccc',
  },
  cameraButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
    width: 150,
    alignItems: 'center',
    marginTop: 20,
  },
  cameraButtonText: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
});
