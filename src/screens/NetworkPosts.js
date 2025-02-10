import React, {useState, useEffect, useRef} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  TextInput,
  Pressable,
} from 'react-native';
import RenderScreen from './RenderScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function NetworkPosts({
  networkDetails,
  networkId,
  isSearchInput,
  userDetails
}) {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState(activeTab);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownHeight] = useState(new Animated.Value(0));
  const [topicScale] = useState(new Animated.Value(1.2));
  const [contentOpacity] = useState(new Animated.Value(0));
  const [searchInput, setSearchInput] = useState('');
  const [finalInput, setFinalInput] = useState('');
  const [sortOption, setSortOption] = useState(); 
  const [searchScale] = useState(new Animated.Value(0.98)); 

  const textInputRef = useRef(null);
  const topics = ['All', ...networkDetails.sub_topics];

  const dropdownAnimation = () => {
    Animated.timing(dropdownHeight, {
      toValue: showDropdown ? 0 : topics.length * 60,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(topicScale, {
        toValue: 1.2,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(topicScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedTopic]);

  const handleTopicSelect = topic => {
    setSelectedTopic(topic);
    setActiveTab(topic);
    dropdownAnimation();
  };

  const setInput = () => {
    setFinalInput(searchInput);
    setSearchInput('');
  };

  const handleFocus = () => {
    Animated.timing(searchScale, {
      toValue: 1.1,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.setNativeProps({
          selection: {start: 0, end: searchInput.length},
        });
      }
    }, 100);
  };

  const toggleSortOption = option => {
    setSortOption(prevOption => (prevOption === option ? null : option)); 
  };

  useEffect(() => {
    if (userDetails.postSortPreference) {
      setSortOption(userDetails.postSortPreference);
    }
  }, [userDetails.postSortPreference]);
  return (
    <View style={{flex: 1}}>
      <View style={{padding: 10, backgroundColor: 'black'}}>
        {!isSearchInput && (
          <>
            <TouchableOpacity
              onPress={dropdownAnimation}
              style={{
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#333',
                borderWidth: 1,
                borderColor: '#1a1a1a',
                borderRadius: 25,
                marginBottom: 10,
              }}>
              <Animated.Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  transform: [{scale: topicScale}],
                }}>
                {selectedTopic === 'All' ? 'All Topics' : selectedTopic}
              </Animated.Text>
            </TouchableOpacity>

            <Animated.View
              style={{
                overflow: 'hidden',
                maxHeight: dropdownHeight,
                borderRadius: 10,
                backgroundColor: '#333',
                marginBottom: 10,
                opacity: dropdownHeight.interpolate({
                  inputRange: [0, topics.length * 60],
                  outputRange: [0, 1],
                }),
              }}>
              {showDropdown && (
                <ScrollView>
                  {topics.map((topic, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleTopicSelect(topic)}
                      style={{
                        paddingVertical: 15,
                        paddingHorizontal: 20,
                        borderBottomWidth: 1,
                        borderColor: '#1a1a1a',
                      }}>
                      <Text style={{color: 'white', fontSize: 16}}>
                        {topic === 'All' ? 'All Topics' : topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Animated.View>

            <ScrollView
              contentContainerStyle={{flexDirection: 'row', gap: 15}}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => toggleSortOption('Featured')}
                style={{
                  backgroundColor: sortOption === 'Featured' ? color : '#333',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10
                }}>
                <Icon name="bar-chart" size={20} color={sortOption === "Featured" ? "white" : "white"} />
                <Text style={{color: 'white', fontSize: 16}}>Featured</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleSortOption('Just In')}
                style={{
                  backgroundColor: sortOption === 'Just In' ? color : '#333',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10
                }}>
                <Icon name="archive" size={20} color={sortOption === "Just In" ? "white" : "white"} />
                <Text style={{color: 'white', fontSize: 16}}>Just In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleSortOption('Crowd Favorites')}
                style={{
                  backgroundColor:
                    sortOption === 'Crowd Favorites' ? color : '#333',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10
                }}>
                <Icon name="people" size={20} color={sortOption === "Crowd Favorites" ? "white" : "white"} />
                <Text style={{color: 'white', fontSize: 16}}>Crowd Favorites</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleSortOption('Snapshots')}
                style={{
                  backgroundColor:
                    sortOption === 'Snapshots' ? color : '#333',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10
                }}>
                <Icon name="image" size={20} color={sortOption === "Snapshots" ? "white" : "white"} />
                <Text style={{color: 'white', fontSize: 16}}>Snapshots</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleSortOption('Motion Media')}
                style={{
                  backgroundColor:
                    sortOption === 'Motion Media' ? color : '#333',
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10
                }}>
                <Icon name="play" size={20} color={sortOption === "Motion Media" ? "white" : "white"} />
                <Text style={{color: 'white', fontSize: 16}}>Motion Media</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

        {isSearchInput && (
          <View
            style={{
              backgroundColor: '#1a1a1a',
              alignItems: 'center',
              padding: 5,
              flexDirection: 'row',
              borderRadius: 5,
              justifyContent: 'space-between',
            }}>
            <TextInput
              ref={textInputRef}
              placeholder={`Search ${networkDetails.network_name}`}
              placeholderTextColor="grey"
              style={{
                color: color,
                width: '90%',
                fontSize: 16,
              }}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={setInput}
              onFocus={handleFocus}
              selectTextOnFocus
              autoCapitalize={false}
              selectionColor="#FF9999"
            />
            <Pressable
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 10,
                padding: 10,
              }}
              onPress={setInput}>
              <Icon name={'search'} color={color} size={20} />
            </Pressable>
          </View>
        )}
      </View>

      <Animated.ScrollView contentContainerStyle={{flexGrow: 1}}>
        <RenderScreen
          network_id={networkId}
          topic={selectedTopic}
          filter={sortOption}
          searchInput={isSearchInput ? finalInput : ''}
          isSearchInput={isSearchInput}
        />
      </Animated.ScrollView>
    </View>
  );
}
