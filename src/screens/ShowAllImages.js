import React from 'react';
import {View, FlatList, Image, StyleSheet, Pressable, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const ShowAllImagesScreen = ({route}) => {
  const navigation = useNavigation();
  const {images} = route.params;

  const renderItem = ({item, index}) => (
    <Pressable
      onPress={() =>
        navigation.navigate('ImageExpand', {images, initialIndex: index})
      }>
      <Image source={{uri: item.url}} style={styles.image} resizeMode="cover" />
    </Pressable>
  );

  if (!images || !Array.isArray(images) || images.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No images to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon
          name="chevron-back"
          size={28}
          color={color}
          onPress={() => navigation.goBack()}
        />
      </View>

      <FlatList
        data={images.map((url, index) => ({url, index}))}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 0.2,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1, 
    marginBottom: 8,
  },
});

export default ShowAllImagesScreen;
