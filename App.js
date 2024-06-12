import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

//assets importing

const petGif = require('./assets/pets/frogbro.gif'); // frog pet
const backgroundImage = require('./assets/backgrounds/beach.png'); // beach bg
const bearClubImage = require('./assets/backgrounds/bearclub.png'); // bearclub bg
const storeBackgroundImage = require('./assets/backgrounds/storebg.png'); // store bg
const heartIcon = require('./assets/icons/heart.png'); // heart icon placeholder
const storeIcon = require('./assets/icons/store.png'); // store icon
const closeButtonIcon = require('./assets/icons/closebutton.png'); // close button icon
const lockIcon = require('./assets/icons/lock.png'); // lock icon
const musicIcon = require('./assets/icons/music.png'); // music icon
const musicMuteIcon = require('./assets/icons/musicmute.png'); // music mute icon
const soundIcon = require('./assets/icons/sound.png'); // sound icon
const soundMuteIcon = require('./assets/icons/soundmute.png'); // sound mute icon

const beachMusic = require('./assets/music/beach.wav'); //importing music for each bg
const bearClubMusic = require('./assets/music/bearclub.wav'); //importing music for bearclub

const backgrounds = [backgroundImage]; // Start with only the beach background


export default function App() {
  //setting the starting parameters for our variables
  const [petHealth, setPetHealth] = useState(100); //pet health
  const healthBarWidth = useRef(new Animated.Value(100)).current; //healthbar width (animated for the smooth transitions)
  const [storeFadeAnim] = useState(new Animated.Value(1)); //just a parameter for fading the store background
  const [showNewScreen, setShowNewScreen] = useState(false);
  const [goldCoins, setGoldCoins] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [backgroundFadeAnim] = useState(new Animated.Value(1)); // New animation value for background fade
  const [isBearClubUnlocked, setIsBearClubUnlocked] = useState(false); // State to track if bearclub is unlocked
  const [sound, setSound] = useState(null); // State to hold the current sound object
  const [menuVisible, setMenuVisible] = useState(false); // State to track if menu is visible
  const [musicEnabled, setMusicEnabled] = useState(true); // State to track if music is enabled
  const [soundEnabled, setSoundEnabled] = useState(true); // State to track if sound is enabled

  useEffect(() => {
    const interval = setInterval(() => {
      const newHealth = Math.min(Math.max(petHealth - 5, 0), 100);
      setPetHealth(newHealth);
      animateHealthBar(newHealth);
    }, 2000);

    return () => clearInterval(interval); // Clear the interval when the component is unmounted
  }, [petHealth]);

  useEffect(() => {
    playBackgroundMusic();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [backgroundIndex]);

  const handleFeedPet = () => {
    const newHealth = Math.min(Math.max(petHealth + 10, 0), 100);
    setPetHealth(newHealth);
    setGoldCoins(goldCoins + 10);
    animateHealthBar(newHealth);
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

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

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const animateHealthBar = (health) => {
    Animated.timing(healthBarWidth, {
      toValue: health,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

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

  const getHealthMessage = () => {
    if (petHealth < 30) {
      return 'Frogbro is hungry! Feed me!';
    } else if (petHealth < 70) {
      return 'Frogbro is a little hungry :>';
    } else {
      return 'Frogbro is full and loves you <3';
    }
  };

  const handleGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 50) {
        // Swiped right
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            if (prevIndex === 1 && !isBearClubUnlocked) {
              return 0; // Prevent swiping to bearclub if locked
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
        // Swiped left
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            if (prevIndex === 0 && !isBearClubUnlocked) {
              return 0; // Prevent swiping to bearclub if locked
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

  const unlockBearClub = () => {
    if (goldCoins >= 100) {
      setGoldCoins(goldCoins - 100);
      setIsBearClubUnlocked(true);
      backgrounds.push(bearClubImage); // Add bearclub to backgrounds
    }
  };

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
        {showNewScreen ? renderStoreScreen() : renderMainScreen()}
      </Animated.View>
    </GestureHandlerRootView>
  );
}

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
    marginBottom: 100, // Adjust this value to move the pet higher
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
    backgroundColor: '#fff', // Blue color for the menu button
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 200, // Position it just below the menu button
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 150,
    zIndex: 10, // Make sure the menu is on top
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
    resizeMode: 'cover', // Ensure the background image fits the screen
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
    width: 70, // Increased size of the close button
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
});

