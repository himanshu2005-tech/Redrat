import firestore from '@react-native-firebase/firestore';

export default async function blockUser({ blocker_id, blocked_id }) {
    try {
      const blockerDoc = firestore().collection('Users').doc(blocker_id);
      const blockedDoc = firestore().collection('Users').doc(blocked_id);
  
      await blockerDoc.update({
        followers: firestore.FieldValue.arrayRemove(blocked_id),
        following: firestore.FieldValue.arrayRemove(blocked_id),
        requested: firestore.FieldValue.arrayRemove(blocked_id),
        blockedUsers: firestore.FieldValue.arrayUnion(blocked_id),
      });
  
      await blockedDoc.update({
        followers: firestore.FieldValue.arrayRemove(blocker_id),
        following: firestore.FieldValue.arrayRemove(blocker_id),
        requested: firestore.FieldValue.arrayRemove(blocker_id),
        blockedBy: firestore.FieldValue.arrayUnion(blocker_id),
      });
  
      return true;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }
  