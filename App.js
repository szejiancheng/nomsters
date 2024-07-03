import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Button, Dimensions, Modal, TextInput } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ASSET IMPORTS
const petGif = require('./assets/pets/frogbro.gif');
const backgroundImage = require('./assets/backgrounds/beach.png');
const bearClubImage = require('./assets/backgrounds/bearclub.png');
const storeBackgroundImage = require('./assets/backgrounds/storebg.png');
const inventoryBackgroundImage = require('./assets/backgrounds/inventory.png');
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
const takePictureIcon = require('./assets/icons/takePicture.png');
const diaryIcon = require('./assets/icons/diary.png');
const rightArrowIcon = require('./assets/icons/rightarrow.png');
const leftArrowIcon = require('./assets/icons/leftarrow.png');

const allBackgrounds = [backgroundImage, bearClubImage];

const USER_DATA_KEY = 'userData';

// Utility Functions for AsyncStorage Interactions
const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
  }
};

const updateUserData = async (newData) => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newData));
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

const addGold = async (amount) => {
  const userData = await getUserData();
  if (userData) {
    userData.goldCoins += amount;
    await updateUserData(userData);
  }
};

const deductGold = async (amount) => {
  const userData = await getUserData();
  if (userData) {
    userData.goldCoins -= amount;
    await updateUserData(userData);
  }
};

const unlockItem = async (itemKey) => {
  const userData = await getUserData();
  if (userData) {
    userData.purchasedItems = {
      ...userData.purchasedItems,
      [itemKey]: true,
    };
    await updateUserData(userData);
  }
};

const isItemUnlocked = async (itemKey) => {
  const userData = await getUserData();
  return userData && userData.purchasedItems[itemKey];
};

// Purchase Function
const purchaseItem = async (itemKey, cost) => {
  const userData = await getUserData();
  if (userData && userData.goldCoins >= cost) {
    await deductGold(cost);
    await unlockItem(itemKey);
    return userData.goldCoins - cost;
  }
  return null;
};

export default function App() {
  // STATE MANAGEMENT
  // Health Bar
  const [petHealth, setPetHealth] = useState(100);
  const [petName, setPetName] = useState('');
  const healthBarWidth = useRef(new Animated.Value(100)).current;
  // Fade Animations
  const [cameraFadeAnim] = useState(new Animated.Value(1));
  const [storeFadeAnim] = useState(new Animated.Value(1));
  const [backgroundFadeAnim] = useState(new Animated.Value(1));
  // Screen Renders
  const [showNewScreen, setShowNewScreen] = useState(false); //for rendering new bgs
  const [showCameraScreen, setShowCameraScreen] = useState(false);
  const [showInventoryScreen, setShowInventoryScreen] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  // Currency
  const [goldCoins, setGoldCoins] = useState(0);
  // Item Unlocks
  const [isBearClubUnlocked, setIsBearClubUnlocked] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState({});
  // Utility
  const [menuVisible, setMenuVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sound, setSound] = useState(null);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [inventoryContent, setInventoryContent] = useState(''); // Added state for inventory content
  // Camera
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  // Camera Storage
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);
  // Modal
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [newPetName, setNewPetName] = useState('');

  // Inventory Slide Animation
  const [inventorySlideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  const [mainScreenSlideAnim] = useState(new Animated.Value(0));

  // Food diary
  const [diaryModalVisible, setDiaryModalVisible] = useState(false);
  const [diaryPictures, setDiaryPictures] = useState([]);
  const [diaryPictureIndex, setDiaryPictureIndex] = useState(0);


  useEffect(() => {
    if (inventoryVisible) {
      Animated.timing(inventorySlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start();
      Animated.timing(mainScreenSlideAnim, {
        toValue: -Dimensions.get('window').height * 0.5,
        duration: 700, 
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(inventorySlideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 700, 
        useNativeDriver: true,
      }).start();
      Animated.timing(mainScreenSlideAnim, {
        toValue: 0,
        duration: 700, 
        useNativeDriver: true,
      }).start();
    }
  }, [inventoryVisible]);
  
  // Health decrease logic
  useEffect(() => {
    const interval = setInterval(() => {
      const newHealth = Math.min(Math.max(petHealth - 5, 0), 100);
      setPetHealth(newHealth);
      animateHealthBar(newHealth);
    }, 5000);

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

  useEffect(() => {
    initializeUserData();
  }, []);

  // Initialize user data
  const initializeUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData === null) {
        const initialData = {
          petName: '',
          goldCoins: 0,
          petHealth: 100,
          pictures: [],
          purchasedItems: {}
        };
        await AsyncStorage.setItem('userData', JSON.stringify(initialData));
        setIsDialogVisible(true);
      } else {
        const data = JSON.parse(userData);
        setPetName(data.petName);
        setGoldCoins(data.goldCoins);
        setPurchasedItems(data.purchasedItems || {});
        setIsBearClubUnlocked(data.purchasedItems?.bearClub || false);
        if (data.petName.trim() === '') {
          setIsDialogVisible(true);
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  // Handle pet name submission
  const handleSetPetName = async () => {
    if (newPetName.trim() === '') return;

    const userData = await getUserData();
    if (userData) {
      userData.petName = newPetName;
      await updateUserData(userData);
      setPetName(newPetName);
      setIsDialogVisible(false);
    }
  };

  //Handle diary icon press
  const handleDiaryPress = async () => {
    const userData = await getUserData();
    const pictures = userData?.pictures || [];
    setDiaryPictures(pictures);
    setDiaryPictureIndex(pictures.length - 1);
    setDiaryModalVisible(true);
  };

  // manualTest for clearing user data
  const manualTestClearUserData = async () => {
    try {
      await AsyncStorage.clear();
      await initializeUserData();
      setGoldCoins(0); // Reset goldCoins state after clearing data
      setPetHealth(100); // Reset petHealth state after clearing data
      setInventoryContent(''); // Reset inventoryContent state after clearing data
      setIsBearClubUnlocked(false); // Reset isBearClubUnlocked state after clearing data
      setPurchasedItems({}); // Reset purchasedItems state after clearing data
      setPetName(''); // Reset petName state after clearing data
      setIsDialogVisible(true); // Show dialog to set pet name after clearing data
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  // manualTest for adding gold
  const manualTestAddGold = async () => {
    const newHealth = Math.min(Math.max(petHealth + 10, 0), 100);
    setPetHealth(newHealth);
    await addGold(10);
    setGoldCoins(prevGold => prevGold + 10); // Update state to reflect gold addition
    animateHealthBar(newHealth);
  };

  // Feed pet handler
  const handleFeedPet = () => {
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

  // Tap pet open inventory
  const handlePetPress = () => {
    setInventoryVisible(!inventoryVisible);
    setShowInventoryScreen(!showInventoryScreen);
  };

  // Handle rename pet
  const handleRenamePet = () => {
    setIsDialogVisible(true);
  };

  // Toggle Music
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

  // Toggle Sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Animate Health Bar
  const animateHealthBar = (health) => {
    Animated.timing(healthBarWidth, {
      toValue: health,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  // Open Store Animation
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

  // Close Store Animation
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

  // Close Camera Animation
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

  // Take Picture Button Functionality
  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setShowCameraScreen(false);
      }
    } catch (error) {
      console.error("Error taking picture: ", error);
    }
  };

  // Health message based on pet health
  const getHealthMessage = () => {
    if (petHealth < 30) {
      return `${petName} is hungry! Feed me!`;
    } else if (petHealth < 70) {
      return `${petName} is a little hungry :>`;
    } else {
      return `${petName} is full and loves you <3`;
    }
  };

  // Swipe gesture for background change
  const handleGesture = async ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const userData = await getUserData();
      const unlockedBackgrounds = [backgroundImage];
      if (userData?.purchasedItems?.bearClub) {
        unlockedBackgrounds.push(bearClubImage);
      }

      if (nativeEvent.translationX > 50) {
        // Handle swipe right
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + unlockedBackgrounds.length) % unlockedBackgrounds.length;
            return newIndex;
          });
          Animated.timing(backgroundFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } else if (nativeEvent.translationX < -50) {
        // Handle swipe left
        Animated.timing(backgroundFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setBackgroundIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % unlockedBackgrounds.length;
            return newIndex;
          });
          Animated.timing(backgroundFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      } else if (nativeEvent.translationY < -50) {
        // Handle swipe up
        setInventoryVisible(true);
        setShowInventoryScreen(true);
      }
    }
  };

  // custom inventory gesture that if you swipe down while in inventory it will close inventory
  const handleInventoryGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > 50) {
        // Handle swipe down to close inventory
        setInventoryVisible(false);
        setShowInventoryScreen(false);
        setInventoryContent(''); // Clear inventory content
      }
    }
  };

  const handleInventoryPetsPress = () => {
    // Handle Pets inventory content here
  };

  const handleInventoryItemsPress = () => {
    // Handle Items inventory content here
  };

  const handleInventoryBackgroundsPress = async () => {
    const userData = await getUserData();
    const unlockedBackgrounds = [backgroundImage];
    if (userData?.purchasedItems?.bearClub) {
      unlockedBackgrounds.push(bearClubImage);
    }
    setInventoryContent(
      <>
        {unlockedBackgrounds.map((bg, index) => (
          <TouchableOpacity key={index} onPress={() => setBackgroundIndex(index)}>
            <ExpoImage source={bg} style={styles.backgroundThumbnail} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backButton} onPress={() => setInventoryContent('')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </>
    );
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
    <Animated.View style={[styles.container, { transform: [{ translateY: mainScreenSlideAnim }] }]}>
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <Animated.View style={styles.container}>
          <Animated.View style={{ ...styles.backgroundContainer, opacity: backgroundFadeAnim }}>
            <ExpoImage source={allBackgrounds[backgroundIndex]} style={styles.background} />
          </Animated.View>
          <TouchableOpacity style={styles.storeButton} onPress={openStore}>
            <ExpoImage source={storeIcon} style={styles.storeIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.diaryButton} onPress={handleDiaryPress}>
            <ExpoImage source={diaryIcon} style={styles.diaryIcon} />
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
            <TouchableOpacity onPress={handlePetPress}>
              <ExpoImage source={petGif} style={styles.pet} />
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.manualTestAddGoldButton} onPress={manualTestAddGold}>
            <Text style={styles.buttonText}>add gold</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.renameButton} onPress={handleRenamePet}>
            <Text style={styles.buttonText}>rename</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualTestClearUserDataButton} onPress={manualTestClearUserData}>
            <Text style={styles.buttonText}>clear data</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
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
        {storeItems.map((item, index) => (
          <View key={index} style={styles.storeItem}>
            <Text style={styles.storeItemName}>{item.name}</Text>
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={() => handlePurchaseItem(item.key, item.cost)}
              disabled={item.isUnlocked || goldCoins < item.cost}
            >
              <ExpoImage
                source={item.image}
                style={item.isUnlocked ? styles.itemImage : styles.greyedItemImage}
              />
              {!item.isUnlocked && (
                <TouchableOpacity style={styles.lockIconContainer} onPress={() => handlePurchaseItem(item.key, item.cost)}>
                  <ExpoImage source={lockIcon} style={styles.lockIcon} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <Text style={styles.storeItemPrice}>
              {item.isUnlocked ? 'Purchased!' : `${item.cost} Gold`}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  // Store items configuration
  const storeItems = [
    {
      key: 'bearClub',
      name: 'Bear Club',
      cost: 100,
      image: bearClubImage,
      isUnlocked: isBearClubUnlocked,
    },
    // Add more items here
  ];

  const handlePurchaseItem = async (itemKey, cost) => {
    const remainingGold = await purchaseItem(itemKey, cost);
    if (remainingGold !== null) {
      setGoldCoins(remainingGold); // Update state to reflect gold deduction
      // Update the local state based on the purchased item
      if (itemKey === 'bearClub') {
        setIsBearClubUnlocked(true);
      }
      // Update state for other items if necessary
    }
  };

  // Camera screen rendering
  const renderCameraScreen = () => (
    <Animated.View style={[styles.cameraContainer, { opacity: cameraFadeAnim }]}>
      <CameraView
        style={styles.cameraView}
        ref={cameraRef}
        facing={facing}
      >
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={closeCamera}>
          <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.takePicture} onPress={takePicture}>
          <ExpoImage source={takePictureIcon} style={styles.takePictureButton} />
        </TouchableOpacity>
      </CameraView>
    </Animated.View>
  );

  // Render Picture Preview Dialogue
  const renderPicturePreview = () => (
    <View style={styles.picturePreviewContainer}>
      <ExpoImage source={{ uri: capturedImage }} style={styles.capturedImage} />
      <TouchableOpacity style={styles.closeButton} onPress={() => {
        setCapturedImage(null);
        setShowCameraScreen(true);
      }}>
        <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.analyseButton} onPress={handleAnalysePicture}>
        <Text style={styles.buttonText}>Analyse</Text>
      </TouchableOpacity>
    </View>
  );

  // Analyse Picture Feature (to add send to API)
  const handleAnalysePicture = async () => {
    try {
      const filename = capturedImage.split('/').pop();
      const newPath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.moveAsync({
        from: capturedImage,
        to: newPath,
      });
  
      // Retrieve existing pictures from AsyncStorage
      const userData = await getUserData();
      const pictures = userData?.pictures || [];
  
      // Add the new picture to the list
      const updatedPictures = [...pictures, newPath];
  
      // Save the updated list of pictures back to AsyncStorage
      await updateUserData({
        ...userData,
        pictures: updatedPictures,
      });
  
      // Set the pictures and open the diary modal
      setDiaryPictures(updatedPictures);
      setDiaryPictureIndex(updatedPictures.length - 1);
      setDiaryModalVisible(true);
    } catch (error) {
      console.error('Error analyzing picture:', error);
    } finally {
      // Clear the captured image state
      setCapturedImage(null);
    }
  };

  // Handle next and previous picture navigation
  const handleNextPicture = () => {
    setDiaryPictureIndex((prevIndex) => Math.min(prevIndex + 1, diaryPictures.length - 1));
  };

  const handlePreviousPicture = () => {
    setDiaryPictureIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Health Bar Animations
  const animatedWidth = healthBarWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const animatedColor = healthBarWidth.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['red', 'orange', 'green'],
  });

  // Inventory screen rendering
  const renderInventoryScreen = () => (
    <PanGestureHandler onHandlerStateChange={handleInventoryGesture}>
      <Animated.View style={styles.backgroundContainer}>
        <ExpoImage source={inventoryBackgroundImage} style={styles.background} />
        <TouchableOpacity style={styles.inventoryCloseButton} onPress={handlePetPress}>
          <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
        </TouchableOpacity>
        <View style={styles.inventoryHeaderContainer}>
          <Text style={styles.inventoryTitle}>Inventory</Text>
        </View>
        <View style={styles.inventoryButtonContainer}>
          {inventoryContent ? (
            inventoryContent
          ) : (
            <>
              <TouchableOpacity style={styles.inventoryButtons} onPress={handleInventoryPetsPress}>
                <Text style={styles.inventoryText}>Pets</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inventoryButtons} onPress={handleInventoryItemsPress}>
                <Text style={styles.inventoryText}>Items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inventoryButtons} onPress={handleInventoryBackgroundsPress}>
                <Text style={styles.inventoryText}>Backgrounds</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );

  // App Structure (With Gesture Handler as the base)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1 }}>
        {capturedImage ? renderPicturePreview() : (
          <>
            <Animated.View style={{ flex: 1, transform: [{ translateY: mainScreenSlideAnim }] }}>
              {showCameraScreen ? renderCameraScreen() : (showNewScreen ? renderStoreScreen() : renderMainScreen())}
            </Animated.View>
            <Animated.View style={[styles.inventoryOverlay, { transform: [{ translateY: inventorySlideAnim }] }]}>
              {renderInventoryScreen()}
            </Animated.View>
          </>
        )}
      </Animated.View>

      <Modal
        visible={isDialogVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDialogVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Your Pet's Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter pet name"
              value={newPetName}
              onChangeText={setNewPetName}
            />
            <Button title="Submit" onPress={handleSetPetName} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={diaryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDiaryModalVisible(false)}
      >
        <View style={styles.diaryModalContainer}>
          <View style={styles.diaryModalContent}>
            <TouchableOpacity style={styles.diaryCloseButton} onPress={() => setDiaryModalVisible(false)}>
              <ExpoImage source={closeButtonIcon} style={styles.closeButtonIcon} />
            </TouchableOpacity>
            {diaryPictures.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.leftArrowButton}
                  onPress={handlePreviousPicture}
                  disabled={diaryPictureIndex === 0}
                >
                  <ExpoImage
                    source={leftArrowIcon}
                    style={diaryPictureIndex === 0 ? styles.greyedArrowIcon : styles.arrowIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rightArrowButton}
                  onPress={handleNextPicture}
                  disabled={diaryPictureIndex === diaryPictures.length - 1}
                >
                  <ExpoImage
                    source={rightArrowIcon}
                    style={diaryPictureIndex === diaryPictures.length - 1 ? styles.greyedArrowIcon : styles.arrowIcon}
                  />
                </TouchableOpacity>
              </>
            )}
            {diaryPictures[diaryPictureIndex] ? (
              <View style={styles.imageContainer}>
                <ExpoImage source={{ uri: diaryPictures[diaryPictureIndex] }} style={styles.diaryImage} />
              </View>
            ) : (
              <View style={styles.picturePlaceholder}>
                {/* Placeholder for picture */}
              </View>
            )}
            <TextInput
              style={styles.diaryTextInput}
              placeholder="Write something..."
              multiline
            />
          </View>
        </View>
      </Modal>

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
  diaryButton: {
    position: 'absolute',
    top: 190,
    left: 20,
    zIndex: 1,
  },
  diaryIcon: {
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
  renameButton: {
    position: 'absolute',
    top: 80,
    right: 0,
    width: 100,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  manualTestAddGoldButton: {
    position: 'absolute',
    top: 130,
    right: 0,
    width: 100,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  manualTestClearUserDataButton: {
    position: 'absolute',
    top: 190,
    right: 0,
    width: 100,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuContainer: {
    position: 'absolute',
    top: 170,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
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
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  greyedItemImage: {
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
  takePicture: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 250,
  },
  takePictureButton: {
    width: 370,
    height: 370,
  },
  picturePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  analyseButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
    width: 150,
    alignItems: 'center',
  },
  inventoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  inventoryContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  inventoryTitle: {
    fontSize: 50,
    color: '#d3b683',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 45,
  },
  inventoryCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  inventoryHeaderContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },  

  inventoryText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center', 
  },
  
  inventoryButtons: {
    backgroundColor: '#d3c683',
    padding: 20,
    borderRadius: 25,
    width: 200,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  
  inventoryButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    width: '80%',
    padding: 20,
    height: 600,
    borderRadius: 10,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  textInput: {
    width: '100%',
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 5,
  },
  backgroundThumbnail: { //inventory background icons
    width: 200,
    height: 200,
    margin: 10,
    borderRadius: 10,
  },
  backButton: {
    backgroundColor: '#d3c683',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: '#000',
  },
  diaryModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  diaryModalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  diaryCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  leftArrowButton: {
    position: 'absolute',
    left: 0,
    top: '40%',
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  rightArrowButton: {
    position: 'absolute',
    right: 0,
    top: '40%',
    transform: [{ translateY: -20 }],
    zIndex: 2,
  },
  arrowIcon: {
    width: 50,
    height: 50,
  },

  greyedArrowIcon: {
    width: 50,
    height: 50,
    opacity: 0,
  },

  imageContainer: {
    width: '100%',
    height: 350, // Adjust the height as needed to show top 2/3 of the picture
    overflow: 'hidden',
  },
  diaryImage: {
    width: '100%',
    height: '150%', // This ensures that only the top 2/3 of the image is visible
    resizeMode: 'cover', // Maintain the aspect ratio of the image
  },
  picturePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  diaryTextInput: {
    width: '100%',
    height: 150,
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    textAlignVertical: 'top',
  },
});
