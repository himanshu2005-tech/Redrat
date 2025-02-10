import firestore from '@react-native-firebase/firestore';

export default async function unBlockUser({ blocker_id, blocked_id }) {
  try {
    const blockerDoc = firestore().collection('Users').doc(blocker_id);
    const blockedDoc = firestore().collection('Users').doc(blocked_id);

    await blockerDoc.update({
      blockedUsers: firestore.FieldValue.arrayRemove(blocked_id),
    });
    await blockedDoc.update({
      blockedBy: firestore.FieldValue.arrayRemove(blocker_id),
    });

    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
}
