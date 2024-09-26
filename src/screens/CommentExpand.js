import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CommentExpand({route, navigation}) {
  const {commentPath} = route.params;
  const [reply, setReply] = useState('');
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth().currentUser?.uid;

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const repliesSnapshot = await firestore()
          .collection(`${commentPath}/Replies`)
          .orderBy('createdAt', 'desc')
          .get();

        const repliesData = await Promise.all(
          repliesSnapshot.docs.map(async doc => {
            const data = doc.data();
            const userDoc = await firestore()
              .collection('Users')
              .doc(data.userId)
              .get();

            return {
              id: doc.id,
              ...data,
              userName: userDoc.data().name || 'Anonymous',
              profile_pic: userDoc.data().profile_pic || '',
              liked: data.likes?.includes(userId),
              createdAt: doc.data().createdAt
                ? doc.data().createdAt.toDate()
                : null,
            };
          }),
        );

        setReplies(repliesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching replies:', error);
        setLoading(false);
      }
    };

    fetchReplies();
  }, [commentPath, userId]);

  const handleAddReply = async () => {
    if (!userId || !reply.trim()) return;

    const newReply = {
      text: reply,
      userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      likes: [],
      likeCount: 0,
    };

    try {
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{marginBottom: 10}}>
          <Icon name="chevron-back" color="#FF3131" size={24} />
        </Pressable>
        <Text style={styles.header}>Comments</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FF3131" />
        ) : replies.length === 0 ? (
          <Text style={styles.noRepliesText}>No replies yet!</Text>
        ) : (
          replies.map(replyItem => (
            <Pressable
              key={replyItem.id}
              style={styles.replyItem}
              onPressIn={() =>
                navigation.push('CommentExpand', {
                  commentPath: `commentPath/${replyItem.id}`,
                })
              }>
              <Image
                source={{uri: replyItem.profile_pic}}
                style={styles.profilePic}
              />
              <View style={{flex: 1}}>
                <Text
                  style={styles.replyUserName}
                  onPress={() =>
                    navigation.navigate('UserProfile', {id: replyItem.userId})
                  }>
                  {replyItem.userName}
                </Text>
                <Text style={styles.replyText}>{replyItem.text}</Text>
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
                    color={replyItem.liked ? '#FF3131' : '#333'}
                  />
                  <Text style={{color: 'white'}}>
                    {replyItem.likeCount || 0}
                  </Text>
                </Pressable>

                {replyItem.userId === userId && (
                  <Pressable onPress={() => handleDeleteReply(replyItem.id)}>
                    <Icon name="trash-outline" size={24} color="#FF3131" />
                  </Pressable>
                )}
              </View>
              
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Write a reply..."
          placeholderTextColor="#666"
          onChangeText={setReply}
          value={reply}
          multiline
        />
        <Pressable
          style={styles.sendButton}
          onPress={handleAddReply}
          disabled={!reply.trim()}>
          <Icon name="send-outline" size={24} color="#FF3131" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingVertical: 20,
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  replyUserName: {
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 3,
  },
  replyText: {
    color: '#FFF',
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
    padding: 10,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    color: '#FFF',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#222',
    marginRight: 10,
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
    marginTop: 10
  },
});
