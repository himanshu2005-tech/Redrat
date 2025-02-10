import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default async function updateTribet(id, points, message, isAppreciate=false) {
  try {
    const currentUser = auth().currentUser.uid;
    const userDocRef = firestore().collection('Users').doc(currentUser);
    const userDocRef1 = firestore().collection('Users').doc(id);

    if (isAppreciate) {
      points = parseFloat(points);
      if (isNaN(points) || points <= 0) {
        throw new Error('Invalid points value.');
      }
      const userDoc = await userDocRef.get();
      if (userDoc.data().tribet < points) {
        return false;
      }

      await userDocRef.update({
        tribet: firestore.FieldValue.increment(-points),
      });

      await userDocRef.collection('Tribet').add({
        tribet: -points,
        message: message,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      await userDocRef1.update({
        tribet: firestore.FieldValue.increment(points),
      });

      await userDocRef1.collection('Tribet').add({
        tribet: points,
        message: message,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      return true;
    }

    await userDocRef1.update({
      tribet: firestore.FieldValue.increment(points),
    });

    await userDocRef1.collection('Tribet').add({
      tribet: points,
      message: message,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Tribet score updated successfully for user ID: ${id}`);
    return true;
  } catch (error) {
    console.error('Error updating Tribet score:', error.message || error);
    return false;
  }
}
