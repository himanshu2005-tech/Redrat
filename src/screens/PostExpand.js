import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Post from './Post';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PostExpand({ route, navigation }) {
  const { post_id, network_id } = route.params;
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth().currentUser?.uid;

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const commentsSnapshot = await firestore()
        .collection('Network')
        .doc(network_id)
        .collection('Posts')
        .doc(post_id)
        .collection('Comments')
        .orderBy('createdAt', 'desc')
        .get();

      const commentsData = await Promise.all(
        commentsSnapshot.docs.map(async doc => {
          const commentData = doc.data();
          const userSnapshot = await firestore()
            .collection('Users')
            .doc(commentData.userId)
            .get();
          const userData = userSnapshot.data();

          return {
            id: doc.id,
            ...commentData,
            userName: userData.name,
            profile_pic: userData.profile_pic,
            liked: commentData.likes?.includes(userId) || false,
            likesCount: commentData.likes?.length || 0,
          };
        }),
      );

      setComments(commentsData);
      setLoading(false);
    };

    fetchComments();
  }, [network_id, post_id, userId]);

  // Add a comment
  const handleAddComment = async () => {
    const userName = auth().currentUser?.displayName;

    if (!userId || !comment.trim()) {
      return;
    }

    const newComment = {
      text: comment,
      userId,
      userName,
      createdAt: firestore.FieldValue.serverTimestamp(),
      likes: [],
    };

    const commentRef = await firestore()
      .collection('Network')
      .doc(network_id)
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
  };

  const handleLikeComment = async (commentId, liked) => {
    const commentRef = firestore()
      .collection('Network')
      .doc(network_id)
      .collection('Posts')
      .doc(post_id)
      .collection('Comments')
      .doc(commentId);

    if (liked) {
      await commentRef.update({
        likes: firestore.FieldValue.arrayRemove(userId),
      });
    } else {
      await commentRef.update({
        likes: firestore.FieldValue.arrayUnion(userId),
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
  };

  const renderCommentItem = ({ item }) => (
    <Pressable style={styles.commentItem} onPress={() => navigation.navigate("CommentExpand", {
      commentPath: `Network/${network_id}/Posts/${post_id}/Comments/${item.id}`
    })}>
      <Image source={{ uri: item.profile_pic }} style={styles.profilePic} />
      <View style={{ flex: 1 }}>
        <Text
          style={styles.commentUserName}
          onPress={() => navigation.navigate('UserProfile', { id: item.userId })}
        >
          {item.userName}
        </Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
      <View style={styles.commentActions}>
        <Pressable
          style={styles.likeButton}
          onPress={() => handleLikeComment(item.id, item.liked)}
        >
          <Icon
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? '#FF3131' : '#333'}
          />
          <Text style={{ color: 'white' }}>{item.likesCount}</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Icon
            name="chevron-down-outline"
            size={28}
            color="#FF3131"
            onPress={() => navigation.goBack()}
          />
        </View>
        <Post post_id={post_id} network_id={network_id} />
        {loading ? (
          <ActivityIndicator size="large" color="#FF3131" />
        ) : comments.length === 0 ? (
          <Text style={styles.noCommentsText}>Be the first to comment!</Text>
        ) : (
          <>
            <Text style={styles.commentsHeader}>Comments:</Text>
            {comments.map(comment => (
              <View key={comment.id}>{renderCommentItem({ item: comment })}</View>
            ))}
          </>
        )}
      </ScrollView>
      <View style={styles.commentSection}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor="#666"
          onChangeText={setComment}
          value={comment}
          multiline
        />
        <Pressable
          style={styles.sendButton}
          onPress={handleAddComment}
          disabled={!comment.trim()}
        >
          <Icon name="send-outline" size={24} color="#FF3131" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingBottom: 10,
  },
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  header: {
    padding: 0,
  },
  commentsHeader: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  commentSection: {
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
  commentItem: {
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
