import React, {useRef, useMemo, useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetBackdrop
 } from '@gorhom/bottom-sheet';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function UserDetails({navigation}) {
  const bottomSheetModalRef = useRef(null);

  const snapPoints = useMemo(() => ['80%'], []);


  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleClosePress = () => bottomSheetModalRef.current?.close()
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleSignOut= () => {
    handleClosePress();
    navigation.goBack();
    auth().signOut();
  }

  return (
    <View style={{backgroundColor: '#1a1a1a', flex: 1}}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>Profile</Text>
      </View>
      <Text style={{marginLeft: 14, color: "white", fontSize: 18, marginTop: 10, fontWeight: 'bold'}}>Account</Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('MyNetworks')}>
        <Text style={{color: 'white', fontSize: 15}}>My Network</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('JoinedNetworks')}>
        <Text style={{color: 'white', fontSize: 15}}>Joined Networks</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('Like')}>
        <Text style={{color: 'white', fontSize: 15}}>Likes</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('Saved')}>
        <Text style={{color: 'white', fontSize: 15}}>Saved</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('PinnedChats')}>
        <Text style={{color: 'white', fontSize: 15}}>Pinned Chats</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      </View>
      <Text style={{marginLeft: 14, color: "white", fontSize: 18, marginTop: 10, fontWeight: 'bold'}}>Edit</Text>
      <View style={{margin: 10, backgroundColor: 'black', borderRadius: 5}}>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('Edit')}>
        <Text style={{color: 'white', fontSize: 15}}>Edit Profile</Text>
        <Icon name="chevron-forward-outline" size={25} color={'white'} />
      </Pressable>
      <Pressable
        style={styles.container}
        onPress={handlePresentModalPress}>
        <Text style={{color: 'red', fontSize: 15}}>Sign Out</Text>
        <Icon name="chevron-forward-outline" size={25} color={'red'} />
      </Pressable>
      </View>
      <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      handleStyle={{backgroundColor: 'black', zIndex: 100}}
      handleIndicatorStyle={{backgroundColor: 'grey'}}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} style={{ backgroundColor: 'black' }} />
      )}
    >
      <BottomSheetView style={{backgroundColor: '#404040', flex: 1}}>
      <View style={{flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', gap: 10}}>
      <Text style={{color: 'red', fontSize: 18, fontWeight:'bold'}}>Are you sure yo want to sign out?</Text>
      <View style={{flexDirection: 'row', gap: 10}}>
        <TouchableOpacity style={{backgroundColor:'white', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 5}} onPress={handleClosePress}>
          <Text style={{color: '#FF3131', fontSize: 15}}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{backgroundColor:'#FF3131', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 5}} onPress={handleSignOut}>
        <Text style={{color: 'white', fontSize: 15}}>Sign Out</Text>
      </TouchableOpacity>
      </View>
    </View>
      </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderColor: 'grey',
    padding: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'black',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
  },
  title: {
    flex: 1,
    fontSize: 24,
    color: '#FF3131',
    marginLeft: 10,
    letterSpacing: 1,
  },
});
