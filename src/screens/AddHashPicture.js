import React, {useState} from 'react';
import {
  Pressable,
  Text,
  View,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Storage from '@react-native-firebase/storage';
import {SharedElement} from 'react-navigation-shared-element';

export default function AddHashPicture({navigation, route}) {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState();
  const [posting, setPosting] = useState(false);
  const {hash} = route.params;

  const selectImages = async () => {
    try {
      const media = await ImagePicker.openPicker({
        multiple: false,
        mediaType: 'photo',
      });

      setImages([media]);
    } catch (error) {
      console.error('Error picking images:', error);
    } finally {
      console.log(images);
    }
  };

  const onSave = async () => {
    try {
      setPosting(true);
      const image = images[0];
      const filePath = image.path;
      const imageRef = Storage().ref(
        `hashpic/${auth().currentUser.uid}/${Date.now()}`,
      );
      await imageRef.putFile(filePath);
      const imageUrl = await imageRef.getDownloadURL();

      await firestore()
        .collection('Hash')
        .doc(hash)
        .collection('Pictures')
        .add({
          postedBy: auth().currentUser.uid,
          title: title,
          imageUri: imageUrl,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      setPosting(false);
      navigation.goBack();
    } catch (error) {
      console.warn(error);
      setPosting(false);
    }
  };
  return (
    <ScrollView style={{backgroundColor: 'black', flex: 1}}>
      <View style={{margin: 10}}>
        <Icon
          name={'close'}
          size={30}
          color="#FF3131"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View>
        {images.length > 0 ? (
          <ScrollView>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{uri: image.path}}
                  style={{
                    margin: 10,
                    height: 300,
                    width: '95%',
                    borderRadius: 20,
                  }}
                  resizeMethod="cover"
                />
              ))}
              <Pressable
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: 10,
                  width: '80%',
                  alignItems: 'center',
                  borderRadius: 10,
                  marginTop: 10,
                }}
                onPress={() => setImages([])}>
                <Text style={{color: 'white', fontSize: 16}}>Cancel Image</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <Pressable
            style={{
              backgroundColor: '#1a1a1a',
              alignItems: 'center',
              height: '40%',
              borderRadius: 20,
              justifyContent: 'center',
              margin: 10,
            }}
            onPress={selectImages}>
            <Icon name={'add'} size={50} color="grey" />
          </Pressable>
        )}
        <TextInput
          style={{
            width: '90%',
            backgroundColor: '#1a1a1a',
            alignSelf: 'center',
            marginTop: 10,
            borderRadius: 10,
            paddingLeft: 10,
            fontSize: 16,
            color: 'grey',
            textAlignVertical: 'top',
          }}
          placeholderTextColor={'grey'}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          multiline={true}
          numberOfLines={10}
        />
      </View>
      {posting ? (
        <LinearGradient
          colors={
            images && title
              ? ['#FF512F', '#DD2476']
              : ['#1a1a1a', 'grey', '#1a1a1a']
          }
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{
            marginTop: 10,
            width: '90%',
            alignSelf: 'center',
            padding: 10,
            alignItems: 'center',
            borderRadius: 10,
          }}>
          <ActivityIndicator color={'white'} />
        </LinearGradient>
      ) : (
        <Pressable onPress={images && title ? onSave : null}>
          <LinearGradient
            colors={
              images && title
                ? ['#FF512F', '#DD2476']
                : ['#1a1a1a', 'grey', '#1a1a1a']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{
              marginTop: 10,
              width: '90%',
              alignSelf: 'center',
              padding: 10,
              alignItems: 'center',
              borderRadius: 10,
            }}>
            <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
              Add Post
            </Text>
          </LinearGradient>
        </Pressable>
      )}
    </ScrollView>
  );
}
