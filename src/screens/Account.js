import React, {useState, useEffect} from 'react';
import {Image, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Bluing from '../texting/Bluing';
import moment from 'moment';
import LinearGradient from 'react-native-linear-gradient';
import color from './color';
import LoadingActivator from '../custom_components/LoadingActivator';
import {SharedElement} from 'react-navigation-shared-element';

export default function Account({navigation, hide}) {
  const [userDetails, setUserDetails] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        const data = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setUserDetails(data.data());
      } catch (error) {
        console.warn(error);
      } finally{
        setLoading(false)
      }
    };
    fetchUserDetails();
  }, []);

  const createdAt = auth().currentUser?.metadata?.creationTime;
  const joinedOn = userDetails.joined_on?.toDate();
  const lastSignIn = auth().currentUser?.metadata?.lastSignInTime;
  const email = auth().currentUser?.email;

  if(loading){
    return (
      <View style={{flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center'}}>
        <LoadingActivator />
      </View>
    )
  }
  return (
    <LinearGradient
      colors={['#000000', '#000000','#000000', color]}
      style={styles.gradient}>
      <View style={styles.container}>
      
        <View style={styles.backButtonContainer}>
          <Icon
            name="chevron-back"
            size={28}
            color={color}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
        <View style={styles.profileContainer}>
          <Image
            source={{uri: userDetails.profile_pic || null}}
            style={styles.profileImage}
          />
          <Text style={styles.username}>{userDetails.name}</Text>
          <Bluing text={userDetails.bio} style={styles.bio} />
          <Text style={styles.infoText}>
            Manage your personal information, monitor your activities, and
            customize your settings to optimize your experience. We prioritize
            the protection of your privacy and ensure that your data is secure.
            Should you require any assistance or have inquiries, our dedicated
            support team is available to provide the necessary guidance. We
            sincerely appreciate your continued engagement with our community
            and are committed to delivering an exceptional user experience.
          </Text>

          <View style={styles.timestampContainer}>
            <View style={styles.row}>
              <TouchableOpacity style={styles.timestampItem}>
                <Icon
                  name="today-outline"
                  size={27}
                  color="white"
                  style={styles.backButton}
                />
                <View>
                  <Text style={{color: 'white'}}>Account Created</Text>
                  <Text style={styles.timestampText}>
                    {createdAt
                      ? moment(createdAt).format('DD MMMM YYYY')
                      : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.timestampItem}>
                <Icon
                  name="ticket-outline"
                  size={27}
                  color="white"
                  style={styles.backButton}
                />
                <View>
                  <Text style={{color: 'white'}}>Account Confirmed</Text>
                  <Text style={styles.timestampText}>
                    {joinedOn ? moment(joinedOn).format('DD MMMM YYYY') : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.timestampItem}>
                <Icon
                  name="timer-outline"
                  size={27}
                  color="white"
                  style={styles.backButton}
                />
                <View>
                  <Text style={{color: 'white'}}>Last Signed In</Text>
                  <Text style={styles.timestampText}>
                    {lastSignIn
                      ? moment(lastSignIn).format('DD MMMM YYYY')
                      : 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.timestampItem}>
                <Icon
                  name="mail-outline"
                  size={27}
                  color="white"
                  style={styles.backButton}
                />
                <View>
                  <Text style={{color: 'white'}}>Linked Email</Text>
                  <Text
                    style={[
                      styles.timestampText,
                      {textAlign: 'left', maxWidth: '100%'},
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle">
                    {email || 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 15,
    top: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 30,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 10,
  },
  profileImage: {
    height: 120,
    width: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    color: '#BBBBBB',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  timestampContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    gap: 10,
  },
  timestampItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  timestampText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
