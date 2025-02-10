import React, {useState, useEffect, Suspense} from 'react';
import {
  Text,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import Bluing from '../texting/Bluing';
import uuid from 'react-native-uuid';
import {TextInput} from 'react-native-gesture-handler';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

export default function CommentExpand({
  commentPath,
  SpamSheild,
  predefinedWords,
  depth = 1,
}) {
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplies, setShowReplies] = useState(false);
  const userId = auth().currentUser?.uid;
  const [typingAt, setTypingAt] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const inpRef = React.useRef(null);

  const fetchReplies = async (isPagination = false) => {
    try {
      const query = firestore()
        .collection(`${commentPath}/Replies`)
        .orderBy('createdAt', 'desc')
        .limit(10);

      const repliesQuery =
        isPagination && lastDoc ? query.startAfter(lastDoc) : query;

      const repliesSnapshot = await repliesQuery.get();

      if (repliesSnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const repliesData = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userIds = repliesData.map(reply => reply.userId);
      const userDocs = await Promise.all(
        userIds.map(id => firestore().doc(`Users/${id}`).get()),
      );

      const userMap = userDocs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      const formattedReplies = repliesData.map(reply => ({
        ...reply,
        userName: userMap[reply.userId]?.name || 'Anonymous',
        profile_pic: userMap[reply.userId]?.profile_pic || '',
        liked: reply.likes?.includes(userId),
        createdAt: reply.createdAt ? reply.createdAt.toDate() : null,
      }));

      setReplies(prev =>
        isPagination ? [...prev, ...formattedReplies] : formattedReplies,
      );
      setLastDoc(repliesSnapshot.docs[repliesSnapshot.docs.length - 1]);
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error fetching replies:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReplies();
    console.log(predefinedWords);
  }, [commentPath, userId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchReplies(true);
    }
  };

  const handleAddReply = async () => {
    if (!userId || !reply.trim()) return;

    if (predefinedWords) {
      const toxicWordsFound = predefinedWords.filter(word =>
        reply.includes(word),
      );

      if (toxicWordsFound.length > 0) {
        const message = `Your comment contains inappropriate language: ${toxicWordsFound.join(
          ', ',
        )}. Please keep the conversation respectful.`;
        Alert.alert('Contains Toxicity', message);

        return;
      }
    }

    const newReply = {
      text: reply,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      likes: [],
      likeCount: 0,
    };

    try {
      console.log(commentPath);
      const addedReplyRef = await firestore()
        .collection(`${commentPath}/Replies`)
        .add(newReply);

      const userDoc = await firestore().collection('Users').doc(userId).get();

      const userData = userDoc.data();

      setReplies(prevReplies => [
        {
          ...newReply,
          id: addedReplyRef.id,
          createdAt: firestore.FieldValue.serverTimestamp(),
          userName: userData.name || 'You',
          profile_pic: userData.profile_pic || '',
          liked: false,
        },
        ...prevReplies,
      ]);

      setReply('');
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleDeleteReply = async replyId => {
    try {
      await firestore().doc(`${commentPath}/Replies/${replyId}`).delete();

      setReplies(prevReplies =>
        prevReplies.filter(reply => reply.id !== replyId),
      );
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const handleLikeReply = async (replyId, liked) => {
    try {
      const replyRef = firestore().doc(`${commentPath}/Replies/${replyId}`);

      if (liked) {
        await replyRef.update({
          likes: firestore.FieldValue.arrayRemove(auth().currentUser.uid),
          likeCount: firestore.FieldValue.increment(-1),
        });
      } else {
        await replyRef.update({
          likes: firestore.FieldValue.arrayUnion(auth().currentUser.uid),
          likeCount: firestore.FieldValue.increment(1),
        });
      }

      setReplies(prevReplies =>
        prevReplies.map(reply =>
          reply.id === replyId
            ? {
                ...reply,
                liked: !liked,
                likeCount: reply.likeCount + (liked ? -1 : 1),
              }
            : reply,
        ),
      );
    } catch (error) {
      console.warn('Error liking/unliking reply:', error);
    }
  };

  useEffect(() => {
    if (typingAt && searchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const querySnapshot = await firestore()
            .collection('Users')
            .where('name', '>=', searchQuery)
            .where('name', '<=', searchQuery + '\uf8ff')
            .limit(5)
            .get();

          const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            profile_pic: doc.data().profile_pic,
          }));
          setSuggestions(users);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, typingAt]);

  const handleTextChange = text => {
    setReply(text);
    inpRef.current = text;

    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1 && text[atIndex + 1] !== ' ') {
      setTypingAt(true);
      setSearchQuery(text.substring(atIndex + 1).trim());
    } else {
      setTypingAt(false);
    }
  };

  const handleSuggestionClick = userName => {
    const atIndex = reply.lastIndexOf('@');
    const newText = reply.substring(0, atIndex) + `@${userName} `;
    setReply(newText);
    setTypingAt(false);
  };

  return (
    <View style={styles.scrollViewContent}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : replies.length === 0 ? null : (
        <FlatList
          data={replies}
          keyExtractor={item => item.id.toString()}
          renderItem={({item: replyItem}) => (
            <View style={{marginHorizontal: 5}}>
              <Pressable key={replyItem.id} style={styles.replyItem}>
                <Image
                  source={{uri: replyItem.profile_pic}}
                  style={styles.profilePic}
                />
                <View style={{flex: 1}}>
                  <Text
                    style={styles.replyUserName}
                    onPress={() =>
                      navigation.navigate('UserProfile', {id: replyItem.userId})
                    }
                    ellipsizeMode="tail">
                    {replyItem.userName}
                  </Text>
                    <Bluing text={replyItem.text} style={styles.replyText} />
                </View>
                <View style={styles.replyActions}>
                  <Pressable
                    style={styles.likeButton}
                    onPress={() =>
                      handleLikeReply(replyItem.id, replyItem.liked)
                    }>
                    <Icon
                      name={replyItem.liked ? 'heart' : 'heart-outline'}
                      size={24}
                      color={replyItem.liked ? color : '#333'}
                    />
                    <Text style={{color: 'white'}}>
                      {replyItem.likeCount || 0}
                    </Text>
                  </Pressable>

                  {replyItem.userId === userId && (
                    <Pressable onPress={() => handleDeleteReply(replyItem.id)}>
                      <Icon name="trash-outline" size={24} color={color} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
              {showReplies ? (
                <Suspense>
                  <CommentExpand
                    commentPath={`${commentPath}/Replies/${replyItem.id}`}
                    SpamSheild={SpamSheild}
                    predefinedWords={predefinedWords}
                    depth={depth + 1}
                  />
                </Suspense>
              ) : null}
              {depth < 2 && (
                <Pressable
                  onPress={() => setShowReplies(!showReplies)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#1a1a1a',
                    padding: 5,
                    borderRadius: 5,
                    marginLeft: 5,
                  }}>
                  <Text style={{color: 'grey'}}>
                    {showReplies ? 'Hide Replies' : 'View Replies'}
                  </Text>

                  <Icon
                    name={showReplies ? 'chevron-up' : 'chevron-down'}
                    color="grey"
                    size={20}
                    onPress={() => setShowReplies(!showReplies)}
                    style={{alignSelf: 'flex-end', marginRight: 10}}
                  />
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={{color: 'grey', textAlign: 'center'}}>
              No replies yet.
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={{
                  padding: 3,
                  alignItems: 'center',
                  backgroundColor: 'black',
                  margin: 10,
                  borderRadius: 5,
                }}
                onPress={handleLoadMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={color} />
                ) : (
                  <Text style={{color: 'grey', fontWeight: 'bold'}}>
                    Load More Comments
                  </Text>
                )}
              </Pressable>
            ) : (
              <Text
                style={{
                  textAlign: 'center',
                  color: 'grey',
                  marginVertical: 10,
                }}>
                No more replies.
              </Text>
            )
          }
        />
      )}

      {depth <= 4 && (
        <View>
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Write a reply..."
              placeholderTextColor="#666"
              onChangeText={handleTextChange}
              defaultValue={reply}
              multiline={true}
            />
            <Pressable
              style={styles.sendButton}
              onPress={handleAddReply}
              disabled={!reply.trim()}>
              <Icon name="push" size={24} color={color} />
            </Pressable>
          </View>
          {typingAt && (
            <ScrollView
              index={uuid.v4()}
              style={{
                backgroundColor: 'black',
                borderRadius: 5,
                marginVertical: 10,
                maxHeight: 150,
              }}>
              <FlatList
                data={suggestions}
                keyExtractor={item => item.id}
                renderItem={({item, index}) => (
                  <KeyboardAvoidingView
                    behavior="position"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
                    <TouchableOpacity
                      style={{
                        padding: 10,
                        backgroundColor: '#1a1a1a',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 5,
                        borderRadius: 5,
                      }}
                      key={index}
                      onPress={() => handleSuggestionClick(item.name)}>
                      <Image
                        source={{uri: item.profile_pic}}
                        style={{height: 35, width: 35, borderRadius: 10}}
                      />
                      <Text style={{color: 'white'}}>{item.name}</Text>
                    </TouchableOpacity>
                  </KeyboardAvoidingView>
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={21}
              />
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingLeft: 5,
  },
  scrollViewContent: {
    paddingLeft: 15,
    paddingVertical: 4,
    borderLeftWidth: 2,
    borderColor: '#1a1a1a',
  },
  header: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noRepliesText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  replyItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  replyUserName: {
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 3,
    maxWidth: '70%',
  },
  replyText: {
    color: '#FFF',
    marginTop: 5,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    gap: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 1,
  },
  input: {
    flex: 1,
    color: '#FFF',
    padding: 2,
    marginRight: 10,
    paddingLeft: 7,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
  },
  sendButton: {
    padding: 10,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
    position: 'absolute',
    bottom: 5,
    right: 10,
    marginTop: 10,
  },
});
