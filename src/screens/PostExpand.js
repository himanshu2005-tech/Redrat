import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Post from './Post';
import Icon from 'react-native-vector-icons/Ionicons';
import updateTribet from './updateTribet';
import blockUser from './blockUser';
import CommentExpand from './CommentExpand';
import {FlatList} from 'react-native-gesture-handler';
import uuid from 'react-native-uuid';
import Bluing from '../texting/Bluing';
import color from './color';
import {SharedElement} from 'react-navigation-shared-element';

const PostExpand = ({route, navigation}) => {
  const {post_id, network_id} = route.params;
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [postDetails, setPostDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spamShield, setSpamShield] = useState();
  const [promptPilot, setPromptPilot] = useState();
  const [likeLoading, setLikeLoading] = useState(false);
  const [predefinedWords, setPredefinedWords] = useState([]);
  const [isCommentSensor, setIsCommentSensor] = useState();
  const [userDetails, setUserDetails] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  const [reply, setReply] = useState('');
  const [networkDetails, setNetworkDetails] = useState([]);
  const [replyId, setReplyId] = useState();
  const [status, setStatus] = useState('Comment');
  const userId = auth().currentUser?.uid;
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentTypingAt, setCommentTypingAt] = useState(false);
  const [replyTypingAt, setReplyTypingAt] = useState(false);
  const [commentSuggestions, setCommentSuggestions] = useState([]);
  const [replySuggestions, setReplySuggestions] = useState([]);
  const [commentSearchQuery, setCommentSearchQuery] = useState('');
  const [replySearchQuery, setReplySearchQuery] = useState('');

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const botDoc = await firestore()
          .collection('Network')
          .doc(network_id)
          .get();
        const isSpamSheildPresent = botDoc
          .data()
          ?.bots?.includes('szOJj5diz9un6vF4s5us');
        const isPromptPilot = botDoc
          .data()
          ?.bots?.includes('wnIEjnIWk0eYlhYUV1Go');
        const isCommentSensor = botDoc
          .data()
          ?.bots?.includes('64A8qV40K1BLHT0ASdOR');

        setSpamShield(isSpamSheildPresent);
        setPromptPilot(isPromptPilot);
        setIsCommentSensor(isCommentSensor);

        setNetworkDetails(botDoc.data());
        if (isCommentSensor) {
          const botData = await firestore()
            .collection('Bots')
            .doc('64A8qV40K1BLHT0ASdOR')
            .get();
          const data = botData.data();
          const predefinedData = data.predefinedData;
          console.log(predefinedData);
          setPredefinedWords(predefinedData);
        }
      } catch (error) {
        console.warn(error);
      }
    };

    fetchBots();
    console.log(predefinedWords);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userData = await firestore()
          .collection('Users')
          .doc(auth().currentUser.uid)
          .get();
        setUserDetails(userData.data());
        setBlocked(userData?.data().blockedUsers || []);
        setBlockedBy(userData?.data().blockedBy || []);
        console.log(userData?.data().blockedUsers);
        console.log(userData?.data().blockedBy);
      } catch (error) {
        console.warn(error);
      }
    };

    fetchUserDetails();
  }, []);
  const fetchComments = async (isPagination = false) => {
    if (loading && isPagination) return;

    let commentsQuery = firestore()
      .collection('Posts')
      .doc(post_id)
      .collection('Comments')
      .limit(10);

    if (userDetails?.commentSortPreference === 'Featured') {
      commentsQuery = commentsQuery
        .orderBy('likeCount', 'desc')
        .orderBy('createdAt', 'desc');
    } else if (userDetails?.commentSortPreference === 'Just In') {
      commentsQuery = commentsQuery.orderBy('createdAt', 'desc');
    } else if (userDetails?.commentSortPreference === 'Crowd Favorites') {
      commentsQuery = commentsQuery.orderBy('likeCount', 'desc');
    } else {
      commentsQuery = commentsQuery.orderBy('createdAt', 'desc');
    }

    if (isPagination && lastDoc) {
      commentsQuery = commentsQuery.startAfter(lastDoc);
    }

    try {
      const commentsSnapshot = await commentsQuery.get();
      const fetchedDocs = commentsSnapshot.docs;

      if (fetchedDocs.length === 0) {
        if (isPagination) setHasMore(false);
        return;
      }

      const commentsData = await Promise.all(
        fetchedDocs.map(async doc => {
          const commentData = doc.data();
          const userSnapshot = await firestore()
            .collection('Users')
            .doc(commentData.userId)
            .get();
          const userData = userSnapshot.data();

          return {
            id: doc.id,
            ...commentData,
            userName: userData?.name || 'Anonymous',
            profile_pic: userData?.profile_pic || '',
            liked: commentData.likes?.includes(userId) || false,
            likesCount: commentData.likes?.length || 0,
          };
        }),
      );

      setComments(prevComments =>
        isPagination ? [...prevComments, ...commentsData] : commentsData,
      );

      setLastDoc(fetchedDocs[fetchedDocs.length - 1]);
      setHasMore(fetchedDocs.length === 1);
    } catch (error) {
      console.warn('Error fetching comments:', error);
    } finally {
      if (isPagination) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [network_id, post_id, userId, userDetails?.commentSortPreference]);

  useEffect(() => {
    let isMounted = true;

    const fetchPostDetails = async () => {
      try {
        const data = await firestore().collection('Posts').doc(post_id).get();

        if (isMounted) {
          setPostDetails(data.data());
          console.log(data.data());
        }
      } catch (error) {
        console.warn(error);
      }
    };

    fetchPostDetails();

    return () => {
      isMounted = false;
    };
  }, [post_id, network_id]);

  useEffect(() => {
    const fetchVisited = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId || !post_id || !networkDetails?.topic) {
          console.warn('Missing userId, post_id, or networkDetails.topic');
          return;
        }

        const postRef = firestore().collection('Posts').doc(post_id);
        const viewsRef = postRef.collection('Views').doc(userId);
        const preferenceRef = firestore()
          .collection('Users')
          .doc(userId)
          .collection('Preferences')
          .doc(networkDetails.topic);

        const data = await viewsRef.get();

        if (!data.exists) {
          const batch = firestore().batch();

          batch.set(viewsRef, {
            seenAt: firestore.FieldValue.serverTimestamp(),
          });

          batch.update(postRef, {
            views: firestore.FieldValue.increment(1),
            viewPoint: firestore.FieldValue.increment(3),
          });

          batch.set(
            preferenceRef,
            {
              score: firestore.FieldValue.increment(1),
            },
            {merge: true},
          );

          await batch.commit();
        }
      } catch (error) {
        console.warn('Error updating views and preferences:', error);
      }
    };

    fetchVisited();
  }, [network_id, post_id, networkDetails?.topic]);

  const handleAddComment = async () => {
    if (!userId || !comment.trim()) return;

    try {
      if (isCommentSensor) {
        const toxicWordsFound = predefinedWords.filter(word =>
          comment.includes(word),
        );

        if (toxicWordsFound.length > 0) {
          const message = `Your comment contains inappropriate language: ${toxicWordsFound.join(
            ', ',
          )}. Please keep the conversation respectful.`;
          Alert.alert('Contains Toxicity', message);

          await updateTribet(
            auth().currentUser.uid,
            -50,
            `Identified toxic comment by CommentSensor on a Post`,
          );
          return;
        }
      }

      if (promptPilot && postDetails.targetWord.length > 0) {
        const isTargetWordFound = comment.includes(postDetails.targetWord);

        if (isTargetWordFound) {
          await firestore()
            .collection('Users')
            .doc(auth().currentUser.uid)
            .collection('Inbox')
            .add({
              message: postDetails.targetReply,
              createdAt: firestore.FieldValue.serverTimestamp(),
              sentBy: 'wnIEjnIWk0eYlhYUV1Go',
              network_id: network_id,
              type: 'comment_reply',
            });

          Alert.alert('Reply sent to your inbox');
          console.log('targetReply sent!!');
        } else {
          console.log('Not found');
        }
      }

      if (spamShield) {
        const commentLimit = 2;
        const timeFrame = 60000;
        const now = Date.now();

        const recentCommentsSnapshot = await firestore()
          .collection('Posts')
          .doc(post_id)
          .collection('Comments')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();

        const recentComments = recentCommentsSnapshot.docs.map(doc =>
          doc.data(),
        );
        const recentCommentCount = recentComments.filter(
          comment => now - comment.createdAt.toMillis() < timeFrame,
        ).length;

        if (recentCommentCount >= commentLimit) {
          Alert.alert(
            'Your commenting access has been temporarily blocked by SpamShield due to high activity. Please try again later.',
          );
          await updateTribet(
            auth().currentUser.uid,
            -15,
            `Identified spam comment`,
          );
          return;
        }
      }

      const newComment = {
        text: comment,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: [],
        likeCount: 0,
      };

      const commentRef = await firestore()
        .collection('Posts')
        .doc(post_id)
        .collection('Comments')
        .add(newComment);

      const userSnapshot = await firestore()
        .collection('Users')
        .doc(userId)
        .get();
      const userData = userSnapshot.data();

      setComment('');
      setComments(prevComments => [
        {
          ...newComment,
          id: commentRef.id,
          likesCount: 0,
          liked: false,
          userName: userData.name,
          profile_pic: userData.profile_pic,
        },
        ...prevComments,
      ]);
      await updateTribet(auth().currentUser.uid, 3, `Comment Addition`);
    } catch (error) {
      console.warn('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async commentId => {
    try {
      await firestore()
        .collection('Posts')
        .doc(post_id)
        .collection('Comments')
        .doc(commentId)
        .delete();

      setComments(prevComments =>
        prevComments.filter(comment => comment.id !== commentId),
      );
    } catch (error) {
      console.warn('Error deleting comment:', error);
      Alert.alert('Error', 'There was an issue deleting your comment.');
    }
  };

  const handleAddReply = async () => {
    if (!userId || !reply.trim()) return;

    if (predefinedWords) {
      const toxicWordsFound = predefinedWords.filter(word =>
        reply.toLowerCase().includes(word.toLowerCase()),
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
      profile_pic: userDetails.profile_pic,
      userName: userDetails.name,
      createdAt: firestore.FieldValue.serverTimestamp(),
      likes: [],
      likeCount: 0,
    };

    try {
      const replyRef = firestore()
        .collection('Posts')
        .doc(post_id)
        .collection('Comments')
        .doc(replyId)
        .collection('Replies');

      await replyRef.add(newReply);
      setReply('');
      setReplyId(null);
      setStatus('Comment');
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchComments(true);
    }
  };

  const handleLikeComment = async (commentId, liked) => {
    setLikeLoading(true);
    const commentRef = firestore()
      .collection('Posts')
      .doc(post_id)
      .collection('Comments')
      .doc(commentId);

    if (liked) {
      await commentRef.update({
        likes: firestore.FieldValue.arrayRemove(userId),
        likeCount: firestore.FieldValue.increment(-1),
      });
    } else {
      await commentRef.update({
        likes: firestore.FieldValue.arrayUnion(userId),
        likeCount: firestore.FieldValue.increment(1),
      });
    }

    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              liked: !liked,
              likesCount: liked
                ? comment.likesCount - 1
                : comment.likesCount + 1,
            }
          : comment,
      ),
    );
    setLikeLoading(false);
  };

  useEffect(() => {
    if (commentTypingAt && commentSearchQuery.length > 0) {
      const fetchUsers = async () => {
        try {
          const querySnapshot = await firestore()
            .collection('Users')
            .where('name', '>=', commentSearchQuery)
            .where('name', '<=', commentSearchQuery + '\uf8ff')
            .limit(5)
            .get();

          const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            profile_pic: doc.data().profile_pic,
          }));
          setCommentSuggestions(users);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    } else {
      setCommentSuggestions([]);
    }
  }, [commentSearchQuery, commentTypingAt]);

  const handleTextChangeComment = text => {
    setComment(text);

    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1 && text[atIndex + 1] !== ' ') {
      setCommentTypingAt(true);
      setCommentSearchQuery(text.substring(atIndex + 1).trim());
    } else {
      setCommentTypingAt(false);
    }
  };

  const handleSuggestionClickComment = userName => {
    const atIndex = reply.lastIndexOf('@');
    const newText = reply.substring(0, atIndex) + `@${userName} `;
    setComment(newText);
    setCommentTypingAt(false);
  };

  const renderCommentItem = ({item}) => {
    const isBlockedUser = blocked.includes(item.userId);
    if (isBlockedUser) {
      return null;
    }
    return (
      <View style={{marginHorizontal: 5}}>
        <Pressable style={styles.commentItem}>
          <Image
            source={{uri: item.profile_pic || null}}
            style={styles.profilePic}
          />
          <View style={{flex: 1}}>
            <Text
              style={styles.commentUserName}
              onPress={() =>
                navigation.navigate('UserProfile', {id: item.userId})
              }>
              {item.userName}
            </Text>
            <Bluing text={item.text} style={styles.commentText} />
          </View>
          <View style={styles.commentActions}>
            <Pressable
              style={styles.likeButton}
              onPress={() =>
                likeLoading ? null : handleLikeComment(item.id, item.liked)
              }>
              <Icon
                name={item.liked ? 'heart' : 'heart-outline'}
                size={24}
                color={item.liked ? color : '#333'}
              />
              <Text style={{color: 'white'}}>{item.likesCount}</Text>
            </Pressable>

            {item.userId === userId && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteComment(item.id)}>
                <Icon name="trash-outline" size={24} color={color} />
              </Pressable>
            )}
          </View>
        </Pressable>
        <View>
          <CommentExpand
            commentPath={`Posts/${post_id}/Comments/${item.id}`}
            SpamSheild={spamShield}
            predefinedWords={predefinedWords}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Icon
                name="chevron-down"
                size={28}
                color={color}
                onPress={() => navigation.goBack()}
              />
              <View style={{alignItems: 'flex-end', marginRight: 5}}>
                <Text style={{color: 'grey'}}>Comment Sort Preference</Text>
                <Text style={{color: 'white', fontSize: 15, fontWeight: 600}}>
                  {userDetails.commentSortPreference}
                </Text>
              </View>
            </View>
              <Post post_id={post_id} />
            {loading && (
              <View
                style={{
                  backgroundColor: 'black',
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator size="small" color={color} />
              </View>
            )}
            <Text style={styles.commentsHeader}>Comments:</Text>
          </>
        }
        data={comments}
        keyExtractor={item => item.id}
        renderItem={renderCommentItem}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a1a',
                margin: 10,
                borderRadius: 5,
              }}
              onPress={handleLoadMore}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={color} />
              ) : (
                <Text style={{color: 'grey', alignSelf: 'center', margin: 10}}>
                  Load More Comments
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                color: 'grey',
                alignSelf: 'center',
                margin: 10,
                textAlign: 'center',
              }}>
              Be the first to comment!
            </Text>
          )
        }
        contentContainerStyle={styles.scrollViewContent}
      />

      {status === 'Reply' ? (
        <View>
          <View style={styles.commentSection}>
            <TextInput
              style={styles.input}
              placeholder={'Write a Reply...'}
              placeholderTextColor="#666"
              onChangeText={handleTextChangeReply}
              defaultValue={reply}
              multiline
            />
            <Pressable
              style={styles.sendButton}
              onPress={handleAddReply}
              disabled={!reply.trim()}>
              <Icon name="send-outline" size={24} color={color} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.commentSection}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor="#666"
            onChangeText={handleTextChangeComment}
            defaultValue={comment}
            multiline
          />
          <Pressable
            style={styles.sendButton}
            onPress={handleAddComment}
            disabled={!comment.trim()}>
            <Icon name="send-outline" size={24} color={color} />
          </Pressable>
        </View>
      )}
      <View style={{padding: 10}}>
        {commentTypingAt && (
          <FlatList
            data={commentSuggestions}
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
                  onPress={() => handleSuggestionClickComment(item.name)}>
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
        )}
        {replyTypingAt && (
          <FlatList
            data={replySuggestions}
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
                  onPress={() => handleSuggestionClickReply(item.name)}>
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
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingBottom: 10,
  },
  scrollViewContent: {
    paddingHorizontal: 2,
    paddingVertical: 20,
  },
  header: {
    padding: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsHeader: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10,
  },
  commentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
  deleteButton: {
    marginLeft: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentUserName: {
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 3,
  },
  commentText: {
    color: '#FFF',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noCommentsText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

PostExpand.sharedElements = route => {
  const {post_id} = route.params;
  return [
    {
      id: `item.${post_id}.post`,
      animation: 'move',
    },
  ];
};

export default PostExpand;
