import React, {useState, useEffect, useRef} from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth'
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function BotScreen({navigation, route}) {
  const {botId} = route.params;
  const [botDetails, setBotDetails] = useState({});
  const [loading, setLoading] = useState();
  const [isIntegrated, setIsIntegrated] = useState(false);
  const [integrations, setIntegrations] = useState()
  const animatedValues = useRef([]).current;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await firestore().collection('Bots').doc(botId).get();
        if (data.exists) {
          setBotDetails(data.data());
          setIntegrations(data.data().numberOfUses)
        } else {
          console.warn('Bot not found');
        }
        setLoading(false);
      } catch (error) {
        console.warn('Error fetching bot details:', error);
      }
    };

    fetchDetails();
  }, [botId]);

  useEffect(() => {
    if (botDetails.Name) {
      const nameChars = botDetails.Name.split('');
      animatedValues.length = 0;

      nameChars.forEach(() => {
        animatedValues.push(new Animated.Value(0));
      });

      const animations = animatedValues.map((value, index) => {
        return Animated.timing(value, {
          toValue: 1,
          duration: 200,
          delay: index * 100,
          useNativeDriver: true,
        });
      });

      Animated.stagger(100, animations).start();
    }
  }, [botDetails]);


  const checkIntegration = async (botData) => {
    const userId = auth().currentUser.uid;
    const userDoc = await firestore().collection('Users').doc(userId).get();
    if (userDoc.exists) {
      const userBots = userDoc.data().bots || [];
      setIsIntegrated(userBots.includes(botId));
    }
  };

  useEffect(() => {
    checkIntegration()
  }, [botId])
  const integrateBot = async() => {
    try{
        await firestore().collection("Users").doc(auth().currentUser.uid).update({
            bots: firestore.FieldValue.arrayUnion(botId)
        })
        await firestore().collection("Bots").doc(botId).update({
            numberOfUses: firestore.FieldValue.increment(1)
        })
        setIsIntegrated(true)
        setIntegrations(integrations+1)
        console.log('Bot integrated successfully!');
    } catch(error){
        console.warn(error)
    }
  }
  if (loading) {
    return (
      <View style={{backgroundColor: 'black', flex: 1, alignItems: 'center'}}>
        <ActivityIndicator color={color} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={28} color={color} />
      </Pressable>
      <View style={styles.profilePicContainer}>
        {botDetails.Name &&
          botDetails.Name.split('').map((char, index) => {
            const animatedValue =
              animatedValues[index] || new Animated.Value(0);
            return (
              <Animated.Text
                key={index}
                style={{
                  ...styles.profilePicText,
                  opacity: animatedValue,
                  transform: [
                    {
                      scale: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                }}>
                {char}
              </Animated.Text>
            );
          })}
      </View>
      <View
        style={{
          backgroundColor: '#1a1a1a',
          marginTop: 10,
          width: '90%',
          borderRadius: 10,
          alignSelf: 'center',
        }}>
        <Text
          style={{
            color: 'white',
            fontSize: 16,
            padding: 10,
            justifyContent: 'center',
          }}>
          {botDetails.desc}
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            width: '100%',
            padding: 5,
            alignItems: 'center',
          }}>
          <Text style={{color: 'white', fontSize: 15}}>
            About
          </Text>
        </View>
      </View>

      {!isIntegrated ? (
        <Pressable
          style={styles.integrateButton}
          onPress={integrateBot}>
          <Text style={styles.integrateButtonText}>Get Bot</Text>
        </Pressable>
      ) : (
        <View style={styles.integratedMessage}>
          <Icon name="checkmark-circle" size={28} color="green" />
          <Text style={styles.integratedText}>Bot integrated</Text>
        </View>
      )}
      <View
        style={{
          backgroundColor: '#1a1a1a',
          width: '90%',
          alignSelf: 'center',
          marginTop: 10,
          alignItems: 'center',
          borderRadius: 10,
        }}>
        <Text style={{color: 'white', padding: 10}}>
          {integrations}
        </Text>
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            width: '100%',
            padding: 5,
            alignItems: 'center',
          }}>
          <Text style={{color: 'white', fontSize: 16}}>
            Number of Integrations
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    padding: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 200,
    marginTop: 10,
  },
  profilePicContainer: {
    backgroundColor: '#1a1a1a',
    width: '90%',
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  profilePicText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'title3',
  },
  integrateButton: {
    backgroundColor: color,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  integrateButtonText: {
    color: 'white',
    fontSize: 17,
    padding: 17,
    fontWeight: "500"
  },
  integratedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center'
  },
  integratedText: {
    color: 'green',
    fontSize: 18,
    paddingLeft: 10,
  },
});
